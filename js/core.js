/* 
 * explanation of core.js declaration
 * 
 * Basic DataOject is prototype DataPoint 
 */
function Site(){
    this.interception = 2;
    this.infiltration_capacity = 40;
    this.max_water_content = 400;
    this.water_content = 120;
    this.porosity = 0.42;
    this.lambda = 0.553;
    this.residual_soil_moisture = 0.05;
    this.saturated_hydraulic_conductivity = 7.3E-7;
    this.radians = 30 * Math.PI / 180; // 60 deg. in radians
    this.sunshine_duration = 0.8;
}

function DataPoint(date, temperature, humidity, precipitation, water_content, Site, velocity, temperature_deficite){
    /* input objects*/
    this.date = date;
    this.temperature = temperature;
    this.humidity = humidity;
    this.precipitation = precipitation;
    this.water_content = water_content;
    this.Site = Site;
    this.velocity = velocity;
    this.temperature_deficite = temperature_deficite;
    
    /* output objects */
    this.infiltration;
    //this.calculateInfiltration = calculateInfiltration;
    this.percolation;
    //this.calculatePercolation = calculatePercolation;
    this.evaporation;
    //this.calculateEvaporation = calculateEvaporation;
    
    /* attribute objects */
    //this.attr_infiltration = new Infiltration(this.precipitation, this.water_content, this.Site);
    //this.attr_percolation = new Percolation(this.Site);
    //this.attr_evaporation = new Evaporation(this.Site);
   
    
    /* methods */
    this.calculateInfiltration = function(){
        this.infiltration = this.attr_infiltration.getInfiltration();
    };
    
    this.calculatePercolation = function(){
        this.percolation = this.attr_percolation.getPercolation();
    };
    
    this.calculateEvaporation = function(){
        this.evaporation = this.attr_evaporation.getEvaporation();
    };
    
    this.getWaterContent = function(){
        final_water_content = this.water_content + this.infiltration - this.percolation
            - this.evaporation;
        
        return final_water_content;
    };
    
    this.refresh = function(){
        /* default infiltration object */
        this.attr_infiltration = new Infiltration(this.precipitation, this.water_content, this.Site);
        this.calculateInfiltration();
        
        /* default percolation object */
        this.attr_percolation = new Percolation((this.water_content + this.infiltration),this.Site);
        this.calculatePercolation();
        
        /*default evaporation object*/
        this.attr_evaporation = new Evaporation(this.date, this.temperature,this.humidity,this.velocity,
            (this.water_content + this.infiltration - this.percolation),this.Site,this.temperature_deficite);
        this.calculateEvaporation();
    };
}

function Station(ImportJSON, stationSiteArray, stationMeta){
    this.Site = stationSiteArray[0];
    this.siteArray = stationSiteArray;
    if (!$.isPlainObject(stationMeta)){
        this.name = 'Development_Station_'+ new Date().getTime();
        this.title = 'Station Record';
        this.lon;
        this.lat;
        this.SiteJSON;
    }
    else {
        this.name = stationMeta['name']+ new Date().getTime();
        this.title = stationMeta['title'];
        this.lon = stationMeta['longitude'];
        this.lat = stationMeta['latitude'];
    }
    this.viewer;
    
  
    this.build = function(ImportJSON, Site){
        data = new Array();
        var water_content;
        $.each(ImportJSON, function(i,point){
            if (i == 0){
                water_content = Site.water_content;
            }
            else {
                water_content = data[i-1].getWaterContent();
            }
            //document.write(Site.water_content);
            data[i] = new DataPoint(new Date(point.date), point.temperature, point.humidity, 
                point.precipitation, water_content, Site, point.velocity);
            data[i].refresh();
        });
        return data;
    };
    
    this.data = this.build(ImportJSON, this.Site);  
    
    this.refresh = function(){
//        $.each(this.data, function(i,point){
//            point.Site = Site;
//            point.refresh();
//        });
          var water_content;
          for (var i = 0;i < this.data.length ;i++){
              if (i==0){
                  water_content = this.Site.water_content;
              }
              else {
                  water_content = this.data[i-1].getWaterContent();
              }
              this.data[i].Site = this.Site;
              this.data[i].water_content = water_content;
              this.data[i].refresh();
          }
          /* Re-render the viewer */
          this.viewer.render();
          
    };
    
    this.gridView = function(){
        grid = new Array();
        $.each(this.data, function(i,point){
            grid.push([
                dateToShortString(point.date),
                //point.date,
                nround(point.temperature,1), 
                Math.round(point.humidity), 
                nround(point.velocity,1),
                nround(point.precipitation,1),
                nround(point.water_content,2),
                nround(point.infiltration,2), 
                nround(point.percolation,2), 
                nround(point.evaporation,2),
                nround((point.getWaterContent() / point.Site.max_water_content * 100),2)
            ]);
        });
        return grid;
    };
}

function Viewer(Station, DOMLocation, params){
    this.Station = Station;
    this.location = DOMLocation;
    this.stationIndex = 0;
    this.tableIdentifier = ''+ new Date().getTime();
 
    if (!$.isPlainObject(params)){
        this.params = {'DataView':'grid','PlotView':'default','tab':'slide','style':'default'};
    }
    else { 
        this.params = params;
        /* here should be a function that checks the params content and sets defaults */
    }
    
    this.reference = function(){
        return this;
    }
    
    this.create = function(){
        try {
            $(this.location).html(
                '<ul id="vw_'+this.Station.name+'" class="vw_'+this.params['tab']+'">'+
                '<li><p class="slide_page"><br>Index Page about Station and Site</p></li>'+
                '<li><p class="slide_page">Plotting view</p></li>'+
                '</ul>'+
                '<div id="slide_page_table">'+
                    '<table class="'+this.params['DataView']+'" id="tb_'+this.Station.name+this.tableIdentifier+'"></table></div><br>'
                
            );
        }
        catch(err) {
            alert(err.message);
        }
    };

    this.renderGrid = function(){
        if (this.params['DataView'] == 'grid'){
            this.data = this.Station.gridView();
            $('#tb_'+this.Station.name+this.tableIdentifier).dataTable({
                "aaData": this.data,
                "aoColumns":[
                    {'sTitle':'Date'},
                    {'sTitle':'Temperature [C]'},
                    {'sTitle':'Humidity [%]'},
                    {'sTitle':'Velocity [m/s]'},
                    {'sTitle':'Rainfall [mm/d]'},
                    {'sTitle':'Soil Water Content [mm]'},
                    {'sTitle':'Infiltration [mm/d]'},
                    {'sTitle':'Groundwater Recharge [mm/d]'},
                    {'sTitle':'Evaporation [mm/d]'},
                    {'sTitle':'Final Soil Moisture [%]'}
                ]
            });
        }
    };
    
    
    this.render = function(){
        this.create();

        //this.renderStation();
        this.renderGrid();
        //this.renderPlot();
        
        $('#vw_'+this.Station.name).bxSlider({
            adaptiveHeight: true
        });
        
    };
    /* build the viewer */
    this.render();
}


function dateToShortString(Date){
    var rstring='';
    var day = Date.getDate();
    if( day < 10){
        day = '0'+day;
    }
    var month = Date.getMonth() + 1;
    if (month < 10){
        month = '0'+month;
    }
    var year = Date.getFullYear();
    rstring += day + "."+ month + "."+ year;

    return rstring;    
}

function nround(value, n){
	/** rounds value correct to n decimal places*/
	if (n == 0 || n == ""){
		return value;
	}
	else {
		n = Math.pow(10, n);
		value = Math.round(value * n) / n;
		
		return value;
	}
}
