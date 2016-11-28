package sk.pdt;

import java.io.Serializable;
import java.util.List;

public class RadiusData implements Serializable {

    private static final long serialVersionUID = 1L;
    private double lng;
    private double lat;
    private double radius;
    private List<String> selectedTypes;

    public static long getSerialVersionUID() {
        return serialVersionUID;
    }

    public double getLng() {
        return lng;
    }

    public void setLng(double lng) {
        this.lng = lng;
    }

    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    public double getRadius() {
        return radius;
    }

    public void setRadius(double radius) {
        this.radius = radius;
    }

    public List<String> getSelectedTypes() {
        return selectedTypes;
    }

    public void setSelectedTypes(List<String> selectedTypes) {
        this.selectedTypes = selectedTypes;
    }
}