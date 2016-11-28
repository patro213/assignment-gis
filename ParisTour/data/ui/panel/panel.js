"use strict";
var selectedCheckboxTypes = [];

$(":checkbox:checked").each(function () {
    selectedCheckboxTypes.push($(this).attr('value'));
});

$(':checkbox').change(function () {
    selectedCheckboxTypes = [];

    $(":checkbox:checked").each(function () {
        selectedCheckboxTypes.push($(this).attr('value'));
    });

    if (selectedCheckboxTypes.length == 0) {
        $('#block_counts').hide();
        self.port.emit("resizePanel", new Size(283, 278));
    }
    else {
        if ($('#block_counts').is(":hidden")) {
            $('#block_counts').show();
            self.port.emit("resizePanel", new Size(283, 353));
        }
    }

    self.port.emit('checkedCheckboxes', selectedCheckboxTypes);
});

self.port.on("initCheckboxes", function () {
    self.port.emit("initCheckboxesReturn", selectedCheckboxTypes);
});

self.port.on("hideRiverText", function () {
    $("#div_show_river").text("Zobraziť hotely pri rieke");
});

$('#slider').on('input', sliderInputChangeListener);
$('#slider').on('change', sliderInputChangeListener);

function sliderInputChangeListener(e) {
    if ($('#radius').is(":visible")) {
        var radius = e.target.value || radius;
        if (e.type == 'input') $('#slider-value')[0].innerHTML = radius + '0 m';
        else self.port.emit('sliderChange', radius);
    }
}

$('#div_show_heatmap').click(function () {
    if($('#div_show_heatmap').text() == "Zobraziť heatmapu"){
        $("#div_show_heatmap").text("Skryť heatmapu");
        self.port.emit('showHeatMap',true);
    }
    else {
        $("#div_show_heatmap").text("Zobraziť heatmapu");
        self.port.emit('showHeatMap',false);
    }
});

$('#div_find_hotels').click(function () {

    self.port.emit('findHotels');

    self.port.on("noPlaceChcecked", function () {
        $("#div_find_hotels").text("Nebolo vybraté miesto").css('color', 'red');
        setTimeout(function () {
            $("#div_find_hotels").text("Nájsť hotely").css('color', 'black');
        }, 1000);
    });
});

$('#div_show_river').click(function () {
    if($('#div_show_river').text() == "Zobraziť hotely pri rieke"){
        $("#div_show_river").text("Skryť hotely pri rieke");
        self.port.emit('showRiver',true);
    }
    else {
        $("#div_show_river").text("Zobraziť hotely pri rieke");
        self.port.emit('showRiver',false);
    }
});

$('#div_enable_paristour').click(function () {

    $('#div_enable_paristour').hide();
    $('#block_counts').show();
    $('#checkboxes').show();
    $('#div_show_heatmap').show();
    $('#div_find_hotels').show();
    $('#div_show_river').show();
    $('#separator2').show();
    $('#div_stop_paristour').show();
    $('#separator3').show();

    self.port.emit('startApplication');
    self.port.emit("resizePanel", new Size(283, 353));
});

$('#div_stop_paristour').click(function () {
    $('#div_enable_paristour').show();
    $('#block_counts').hide();
    $('#checkboxes').hide();
    $('#div_show_heatmap').hide();
    $('#div_find_hotels').hide();
    $('#div_show_river').hide();
    $('#separator2').hide();
    $('#div_stop_paristour').hide();
    $('#separator3').hide();

    self.port.emit('stop');
    self.port.emit("resizePanel", new Size(283, 95));
});

function Size(width, height) { // struktura pre zmenu velkosti okna rozsirenia
    this.width = width;
    this.height = height;
}