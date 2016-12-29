/* Data codebook */

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

// Inititalize map

var map = L.map('map').setView([48.4447, 35.0062], 12);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var threshold = d3.scale.threshold()
    .domain([0,200,400,1000])
    .range(colorbrewer.Blues[5]);

var OpenStreetMap_Mapnik = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),
    OpenStreetMap_BlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),
    Esri_WorldTopoMap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    }),
    Esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    CartoDB_Positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
      subdomains: 'abcd',
      maxZoom: 19
    });

var layers = {
  "OpenStreetMap.Mapnik": OpenStreetMap_Mapnik,
  "OpenStreetMap.BlackAndWhite": OpenStreetMap_BlackAndWhite,
  "Esri.WorldTopoMap": Esri_WorldTopoMap,
  "Esri.WorldImagery": Esri_WorldImagery,
  "CartoDB.Positron": CartoDB_Positron
};

function setLayer(layer) { map.addLayer(layers[layer]); }

function removeLayer(layer) { map.removeLayer(layers[layer]);}

function onEachFeature(feature, layer) {
    layer.on({
      mouseover: showInfo,
      mouseout: hideInfo
    });
  }

function showInfo(e) {

  var layer = e.target;
  var info = '<p class="label label-primary">Інформація про дільницю</p>'
  info += '<h3>ВД №' + layer.feature.properties.district + '</h3>';
  info += "<p><strong>" + titles[app.current_filter.map_filter+1] + ": ";
  if (titles[app.current_filter.map_filter].indexOf("%") > -1) {
    info += Math.round(layer.feature.properties["d"+(app.current_filter.map_filter+1)]*10000)/100 + "%</strong></p>"
  } else {
    info += layer.feature.properties["d"+(app.current_filter.map_filter+1)] + " голосів</strong></p>"
  }

  info += "<p>Загальна кількість виборців: " + layer.feature.properties["d1"] + "</p>";
  info += "<p>Межі виборчої дільниці:</p>";
  info += "<p>" + layer.feature.properties['descr'] + "</p>";
  app.$set('info', info);
}

function hideInfo(e) {
  app.$set('info', "");
}

function style(feature) {
    return {
      weight: 1.5,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7,
      fillColor: threshold(feature.properties.d1)
    };
  }

var polygons = [];

for (i=0; i<data.length; i++) {
  polygons.push(L.geoJSON(data[i],{style: style, onEachFeature: onEachFeature}).addTo(map));
}

function update_map(map_data, opts) {
	heatmap.setLatLngs(map_data).setOptions(opts);
}

app = new Vue({
  el: '#app',
  created: function() {
    setLayer("CartoDB.Positron");
    this.$set('current_filter.map_filter', 26);
  },
  data: {
    info: "",
    titles:titles,
  	filters: {
	  	map_type: Object.keys(layers),
	  	map_color: Object.keys(colorbrewer),
	  	map_filter: Array.apply(null, Array(titles.length)).map(function (_, i) {return i;}).slice(1,titles.length)
	  },
  	current_filter: {
  		map_color: "YlOrRd",
      map_filter: 1
  	},
    map_type: "CartoDB.Positron"
  },
  methods: {
  	return_label: function(index) {
  		return false
  	}
  },
  watch: {
  	'map_type': {
  		handler: function(filter, oldFilter) {
        removeLayer(oldFilter);
        setLayer(filter);
  		}},
    'current_filter': {
      handler: function(filter, oldFilter) {

        var numbers = data.map(function(d) { return (d.properties['d' + (filter.map_filter + 1)]); });
        numbers = numbers.filter(function(d) { return d != 0; })
        var cur_threshold = d3.scale.linear()
          .domain([0,numbers.min(),numbers.max()])
          .range(["#CCCCCC",colorbrewer[filter.map_color][6][0],colorbrewer[filter.map_color][6][5]]);

        function newstyle(feature) { return { fillColor: cur_threshold(feature.properties['d' + (filter.map_filter+1)]) };}

        for (i=0;i<polygons.length;i++) { polygons[i].setStyle(newstyle); }
      },
      deep: true
    }
  }
})

