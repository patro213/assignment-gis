var buttons = require('sdk/ui/button/action');
// var tabs = require("sdk/tabs").on("ready", runScript);
var tabs = require("sdk/tabs");
var contextMenu = require("sdk/context-menu");
var {ToggleButton} = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var Request = require("sdk/request").Request;

var button = ToggleButton({ // zakladne nastavenia rozsirenia
    id: "my-button",
    label: "ParisTour",
    icon: {
        "16": "./icon/icon-16.png",
        "32": "./icon/icon-32.png",
        "64": "./icon/icon-64.png"
    },
    contentScriptFile: data.url("../lib/jquery/jquery-1.11.3.min.js"),
    onChange: handleChange
});

var panel = panels.Panel({ // zakladne nastavenia rozsirenia
    contentURL: data.url("ui/panel/panel.html"),
    contentStyleFile: data.url("ui/panel/panel.css"),
    contentScriptFile: [data.url("../lib/jquery/jquery-1.11.3.min.js"), data.url("ui/panel/panel.js")],
    width: 283,
    height: 95,

    position: button,
    onHide: function () {
        button.state('window', {checked: false});
    }
});

function handleChange(state) {
    panel.show();
    if (state.checked) {

        panel.port.on('startApplication', function () {
            openMapAndStartApplication();
        });


    }
    panel.port.on("resizePanel", function (sizes) { // zmena velkosti okna rozsirenia
        panel.resize(sizes.width, sizes.height);
    });
}

function openMapAndStartApplication() {

    tabs.open("../data/index.html");

    var worker = tabs.activeTab.attach({
        contentScriptFile: [
            data.url("../lib/jquery/jquery-1.11.3.min.js"),
            data.url("app.js"),
            data.url("../lib/mapbox/mapbox.js"),
            data.url("../lib/leaflet/leaflet-heat.js"),
            data.url("../lib/mapbox/mapbox.directions.js")
        ],
        contentStyleFile: data.url("../lib/mapbox/mapbox.directions.css")
    });

    tabs.on("ready", function (tab) {
        worker = tab.attach({
            contentScriptFile: [
                data.url("../lib/jquery/jquery-1.11.3.min.js"),
                data.url("app.js"),
                data.url("../lib/mapbox/mapbox.js"),
                data.url("../lib/leaflet/leaflet-heat.js"),
                data.url("../lib/mapbox/mapbox.directions.js")
            ],
            contentStyleFile: data.url("../lib/mapbox/mapbox.directions.css")
        });

        worker.port.emit("initMap");

        worker.port.on("initCheckboxes", function () {
            panel.port.emit("initCheckboxes");
        });

        worker.port.on("noPlaceChcecked", function () {
            panel.port.emit("noPlaceChcecked");
        });

        worker.port.on('hideRiverText', function () {
            panel.port.emit("hideRiverText");
        });
    });

    panel.port.on('checkedCheckboxes', function (selectedCheckboxTypes) {
        worker.port.emit('checkedCheckboxes', selectedCheckboxTypes);
    });

    panel.port.on('sliderChange', function (radius) {
        worker.port.emit('sliderChange', radius);
    });

    panel.port.on('initCheckboxesReturn', function (selectedCheckboxTypes) {
        worker.port.emit('initCheckboxesReturn', selectedCheckboxTypes);
    });

    panel.port.on('findHotels', function () {
        worker.port.emit('findHotels');
    });

    panel.port.on('showHeatMap', function (show) {
        worker.port.emit('showHeatMap',show);
    });

    panel.port.on('showRiver', function (show) {
        worker.port.emit('showRiver',show);
    });

    panel.port.on('stop', function () {
        worker.tab.close();
    });
}