package sk.pdt;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.*;
import java.util.List;
import java.util.Properties;

@RestController
public class Controller {

    @RequestMapping(value = "/showSelectedData", method = RequestMethod.POST)
    public
    @ResponseBody
    ResponseEntity<String> getSelectedData(@RequestBody final RadiusData radiusData) throws SQLException {

        System.out.println("---------------drawInRealTime-------------------");

        boolean amenity = false;
        boolean tourism = false;

        StringBuilder amenityValues = new StringBuilder();
        StringBuilder tourismValues = new StringBuilder();
        StringBuilder resultJson = new StringBuilder();
        boolean isEmpty = true;

        amenityValues.append("amenity in (");
        tourismValues.append("tourism in (");
        resultJson.append("[");

        for (String s : radiusData.getSelectedTypes()) {
            if (("theatre").equals(s) || ("cinema").equals(s) || ("bar").equals(s)) {
                amenityValues.append("'" + s + "',");
                amenity = true;
            } else {
                tourismValues.append("'" + s + "',");
                tourism = true;
            }
        }

        amenityValues.setCharAt(amenityValues.length() - 1, ')');
        tourismValues.setCharAt(tourismValues.length() - 1, ')');

        Connection conn = null;
        PreparedStatement stmt = null;
        Properties connectionProps = new Properties();
        connectionProps.put("user", "postgres");
        connectionProps.put("password", "postgre");
        String connectionString = "jdbc:postgresql://localhost:5432/postgis_22_sample";

        try {
            conn = DriverManager.getConnection(connectionString, connectionProps);
            ResultSet rs;

            if (amenity) {
                String selectAmenity = "SELECT row_to_json(f) FROM " +
                        "(SELECT 'Feature' As type, ST_AsGeoJSON(ST_Transform(way,4326))::json As geometry, " +
                        "(select row_to_json(t) FROM " +
                        "(SELECT name as title, amenity as markersymbol) As t) As prop " +
                        "FROM planet_osm_point " +
                        "where name <> '' and " + amenityValues.toString() + " " +
                        "and ST_Contains((SELECT ST_Buffer(ST_MakePoint(" + radiusData.getLng() + "," + radiusData.getLat() + ")::geography," + radiusData.getRadius() + "))::geometry, (st_transform(way::geometry,4326))::geometry)) As f;";

                stmt = conn.prepareStatement(selectAmenity);
                rs = stmt.executeQuery();

                while (rs.next()) {
                    if (rs.isLast()) {
                        resultJson.append(rs.getString(1));
                        isEmpty = false;
                        break;
                    }
                    resultJson.append(rs.getString(1) + ",");
                }
            }

            if (tourism) {
                String selectTourism = "SELECT row_to_json(f) FROM " +
                        "(SELECT 'Feature' As type, ST_AsGeoJSON(ST_Transform(way,4326))::json As geometry, " +
                        "(select row_to_json(t) FROM " +
                        "(SELECT name as title, tourism as markersymbol) As t) As prop " +
                        "FROM planet_osm_point " +
                        "where name <> '' and " + tourismValues.toString() + " and " +
                        "ST_Contains(" +
                        "(SELECT ST_Buffer(ST_MakePoint(" + radiusData.getLng() + "," + radiusData.getLat() + ")::geography," + radiusData.getRadius() + "))::geometry, (st_transform(way::geometry,4326))::geometry)) As f;";

                stmt = conn.prepareStatement(selectTourism);
                rs = stmt.executeQuery();

                while (rs.next()) {
                    if (rs.isFirst() && !isEmpty) {
                        resultJson.append(",");
                    }
                    if (rs.isLast()) {
                        resultJson.append(rs.getString(1));
                        break;
                    }
                    resultJson.append(rs.getString(1) + ",");
                }
            }
        } catch (SQLException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } finally {
            stmt.close();
            conn.close();
        }

        resultJson.append("]");

        return new ResponseEntity<>(resultJson.toString(), HttpStatus.OK);
    }

    @RequestMapping(value = "/findHotels", method = RequestMethod.POST)
    public
    @ResponseBody
    ResponseEntity<String> findHotels(@RequestBody List<Point> pointList) throws SQLException {

        System.out.println("---------------findHotels-------------------");

        int arrayLength = pointList.size();
        String selectStatementString = "";
        String hotelsPolygon = "";
        int distancePolygon = 0;
        int distancePoint = 100;
        String finalQuery = "";
        String finalQueryPoint = "";

        StringBuilder resultJson = new StringBuilder();
        resultJson.append("[");
        int count = 0;

        if (arrayLength > 2) {
            StringBuilder sbPolygon = new StringBuilder();
            for (Point point : pointList) {
                sbPolygon.append(point.getLng() + " " + point.getLat() + ",");
            }
            sbPolygon.append(pointList.get(0).getLng() + " " + pointList.get(0).getLat());
            finalQuery = sbPolygon.toString();
        } else if (arrayLength == 2) {
            StringBuilder sbPoint = new StringBuilder();
            sbPoint.append("ST_MakePoint(" + pointList.get(0).getLng() + ", " + pointList.get(0).getLat() + "),");
            sbPoint.append("ST_MakePoint(" + pointList.get(1).getLng() + ", " + pointList.get(1).getLat() + ")");
            finalQueryPoint = sbPoint.toString();
        }

        Connection conn = null;
        PreparedStatement stmt = null;
        Properties connectionProps = new Properties();
        connectionProps.put("user", "postgres");
        connectionProps.put("password", "postgre");
        String connectionString = "jdbc:postgresql://localhost:5432/postgis_22_sample";

        while (count < 1 && distancePolygon < 10000) {
            try {
                conn = DriverManager.getConnection(connectionString, connectionProps);

                if (arrayLength == 1) {
                    double lng = pointList.get(0).getLng();
                    double lat = pointList.get(0).getLat();

                    selectStatementString = "SELECT row_to_json(f) FROM " +
                            "(SELECT 'Feature' As type, ST_AsGeoJSON(ST_Transform(way,4326))::json As geometry, " +
                            "(select row_to_json(t) FROM " +
                            "(SELECT name as title, tourism as markersymbol) As t) As prop " +
                            "FROM planet_osm_point " +
                            "where tourism like 'hotel' and name <> '' and " +
                            "st_contains(" +
                            "(SELECT ST_Buffer(ST_MakePoint(" + lng + "," + lat + ")::geography," + distancePoint + "))::geometry, (st_transform(way::geometry,4326))::geometry)) As f;";

                    hotelsPolygon = "SELECT ST_AsGeoJSON(ST_Buffer(ST_MakePoint(" + lng + "," + lat + ")::geography," + distancePoint + "));";
                } else if (arrayLength == 2) {
                    selectStatementString = "SELECT row_to_json(f) FROM " +
                            "(SELECT 'Feature' As type, ST_AsGeoJSON(ST_Transform(way,4326))::json As geometry, " +
                            "(select row_to_json(t) FROM " +
                            "(SELECT name as title, tourism as markersymbol) As t) As prop " +
                            "FROM planet_osm_point " +
                            "where tourism like 'hotel' and name <> '' and " +
                            "st_contains(" +
                            "(SELECT ST_Buffer(ST_MakeLine(" + finalQueryPoint + ")::geography, " + distancePoint + "))::geometry, (st_transform(way::geometry,4326))::geometry)) As f;";

                    hotelsPolygon = "SELECT ST_AsGeoJSON(ST_Buffer(ST_MakeLine(" + finalQueryPoint + ")::geography, " + distancePoint + "));";
                } else {
                    selectStatementString = "SELECT row_to_json(f) FROM " +
                            "(SELECT 'Feature' As type, ST_AsGeoJSON(ST_Transform(way,4326))::json As geometry, " +
                            "(select row_to_json(t) FROM " +
                            "(SELECT name as title, tourism as markersymbol) As t) As prop " +
                            "FROM planet_osm_point " +
                            "where tourism like 'hotel' and name <> '' and " +
                            "st_contains(" +
                            "(SELECT ST_Buffer(ST_MakePolygon(ST_GeomFromText('LINESTRING(" + finalQuery + ")'))::geography, " + distancePolygon + "))::geometry, (st_transform(way::geometry,4326))::geometry)) As f;";

                    hotelsPolygon = "SELECT ST_AsGeoJSON(ST_Buffer(ST_MakePolygon(ST_GeomFromText('LINESTRING(" + finalQuery + ")'))::geography, " + distancePolygon + "));";
                }

                stmt = conn.prepareStatement(selectStatementString);
                ResultSet rs = stmt.executeQuery();

                while (rs.next()) {
                    if (rs.isLast()) {
                        resultJson.append(rs.getString(1));
                        count++;
                        break;
                    }
                    resultJson.append(rs.getString(1) + ",");
                    count++;
                }

                if (count > 0) {
                    stmt = conn.prepareStatement(hotelsPolygon);
                    rs = stmt.executeQuery();

                    resultJson.append(',');

                    while (rs.next()) {
                        if (rs.isLast()) {
                            resultJson.append(rs.getString(1));
                            break;
                        }
                        resultJson.append(rs.getString(1) + ",");
                    }
                }

            } catch (SQLException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            } finally {
                stmt.close();
                conn.close();
            }

            System.out.println("Distance polygon:" + distancePolygon + " Pocet najdenych hotelov:" + count);
            distancePolygon = distancePolygon + 100;

            System.out.println("Distance point:" + distancePoint + " Pocet najdenych hotelov:" + count);
            distancePoint = distancePoint + 100;
        }


        resultJson.append("]");

        return new ResponseEntity<>(resultJson.toString(), HttpStatus.OK);
    }

    @RequestMapping(value = "/heatMap", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    public
    @ResponseBody
    ResponseEntity<String> getHeatMapPoints() throws SQLException {

        System.out.println("---------------heatMap-------------------");

        StringBuilder sb = new StringBuilder();
        sb.append("[");

        Connection conn = null;
        PreparedStatement stmt = null;
        Properties connectionProps = new Properties();
        connectionProps.put("user", "postgres");
        connectionProps.put("password", "postgre");
        String connectionString = "jdbc:postgresql://localhost:5432/postgis_22_sample";

        try {
            conn = DriverManager.getConnection(connectionString, connectionProps);

            String selectStatementString = "SELECT ST_AsGeoJSON(ST_Transform(way,4326))::json As geometry " +
                    "FROM planet_osm_point " +
                    "where (amenity IN('theatre','cinema','bar') or tourism IN('hotel','museum','gallery')) and name <> '';";

            stmt = conn.prepareStatement(selectStatementString);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                if (rs.isLast()) {
                    sb.append(rs.getString(1));
                    break;
                }
                sb.append(rs.getString(1) + ",");
            }
        } catch (SQLException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } finally {
            stmt.close();
            conn.close();
        }

        sb.append("]");

        return new ResponseEntity<>(sb.toString(), HttpStatus.OK);
    }

    @RequestMapping(value = "/showRiver", method = RequestMethod.POST)
    public
    @ResponseBody
    ResponseEntity<String> getRiverData(@RequestBody final RadiusData radiusData) throws SQLException {

        System.out.println("---------------showRiver-------------------");

        StringBuilder resultJson = new StringBuilder();

        resultJson.append("[");

        Connection conn = null;
        PreparedStatement stmt = null;
        Properties connectionProps = new Properties();
        connectionProps.put("user", "postgres");
        connectionProps.put("password", "postgre");
        String connectionString = "jdbc:postgresql://localhost:5432/postgis_22_sample";

        try {
            conn = DriverManager.getConnection(connectionString, connectionProps);

            // spravi z rieky polygon
            String riverAsPolygon = "SELECT row_to_json(f) FROM " +
                    "(SELECT 'Feature' As type, ST_AsGeoJSON(ST_Buffer(ST_union(ST_Transform(way,4326))::geography, 500))::json As geometry  " +
                    "FROM planet_osm_line " +
                    "where waterway like 'river' and name like 'La Seine') As f;";

            //vrati true/false ci sa kruh pretina s riekou
            String isIntersectionEmpty = "SELECT ST_IsEmpty(ST_Intersection((SELECT ST_Buffer(ST_MakePoint(" + radiusData.getLng() + ", " + radiusData.getLat() + ")::geography," + radiusData.getRadius() + ")), (SELECT ST_Buffer(ST_Union(ST_Transform(way,4326))::geography, 500) FROM planet_osm_line WHERE waterway LIKE 'river' AND name LIKE 'La Seine'))::geometry);";

            // vrati hotely v prieniku rieky a kruhu
            String hotelIntersectionPolygon = "SELECT row_to_json(f) FROM " +
                    "(SELECT 'Feature' AS type, ST_AsGeoJSON(ST_Transform(way,4326))::json AS geometry, " +
                    "(SELECT row_to_json(t) FROM (SELECT name AS title, tourism AS markerSymbol) AS t) AS prop " +
                    "FROM planet_osm_point " +
                    "WHERE name <> '' AND tourism LIKE 'hotel' " +
                    "AND ST_Within((ST_Transform(way,4326))::geometry, " +
                    "ST_Intersection(" +
                    "(SELECT ST_Buffer(ST_MakePoint(" + radiusData.getLng() + ", " + radiusData.getLat() + ")::geography," + radiusData.getRadius() + ")), " +
                    "(SELECT ST_Buffer(ST_Union(ST_Transform(way,4326))::geography, 500) " +
                    "FROM planet_osm_line " +
                    "WHERE waterway LIKE 'river' AND name LIKE 'La Seine'))::geometry)) AS f";

            //vrati vsetky hotely v okoli rieky
            String riverHotels = "SELECT row_to_json(f) FROM " +
                    "(SELECT 'Feature' AS type, ST_AsGeoJSON(ST_Transform(way,4326))::json AS geometry, " +
                    "(SELECT row_to_json(t) " +
                    "FROM (SELECT name AS title, tourism AS markerSymbol) AS t) AS prop " +
                    "FROM planet_osm_point " +
                    "WHERE name <> '' AND tourism LIKE 'hotel' AND " +
                    "ST_Within((st_transform(way,4326))::geometry, " +
                    "(SELECT ST_Buffer(ST_Union(ST_Transform(way,4326))::geography, 500)::geometry " +
                    "FROM planet_osm_line " +
                    "WHERE waterway LIKE 'river' AND name LIKE 'La Seine'))) AS f";

            ResultSet rs;
            stmt = conn.prepareStatement(riverAsPolygon);
            rs = stmt.executeQuery();

            while (rs.next()) {
                if (rs.isLast()) {
                    resultJson.append(rs.getString(1));
                    break;
                }
                resultJson.append(rs.getString(1) + ",");
            }

            stmt = conn.prepareStatement(isIntersectionEmpty);
            rs = stmt.executeQuery();


            if (rs.next() && !rs.getBoolean(1)) {
                stmt = conn.prepareStatement(hotelIntersectionPolygon);
                rs = stmt.executeQuery();
            } else if (rs.getBoolean(1)) {
                stmt = conn.prepareStatement(riverHotels);
                rs = stmt.executeQuery();
            }

            while (rs.next()) {
                if (rs.isFirst()) {
                    resultJson.append(',');
                }
                if (rs.isLast()) {
                    resultJson.append(rs.getString(1));
                    break;
                }
                resultJson.append(rs.getString(1) + ",");
            }
        } catch (SQLException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } finally {
            stmt.close();
            conn.close();
        }

        resultJson.append("]");

        return new ResponseEntity<>(resultJson.toString(), HttpStatus.OK);
    }

}