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
    this.radians = 60 * Math.PI / 180; // 60 deg. in radians
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

function Station(ImportJSON, stationSite){
    this.Site = stationSite;
  
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
    
    this.refresh = function(Site){
        $.each(this.data, function(i,point){
            point.Site = Site;
            point.refresh();
        });
    };
    
    
}

