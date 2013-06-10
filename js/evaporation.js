/* 
 *  This file is part of:
 *  WBM2 - WaterBalanceModel 2.0. Your OpenSource balancing solution.
 *  Copyright (C) 2011 - 2013  Mirko Maelicke
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  any later version.

 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.

 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function Evaporation(date, temperature,humidity,velocity,water_content,Site,temperature_deficite){
    this.date = date;
    this.temperature = temperature;
    this.humidity = humidity;
    this.velocity = velocity;
    this.water_content = water_content;
    this.Site = Site;
    /* temp deficite should be optional */
    if (typeof temperature_deficite === "undefined" || temperature_deficite === null){
        this.temperatur_deficite = Number.NaN;
    }
    else {
        this.temperatue_deficite = temperature_deficite;
    }
    this.soil_moisture = this.water_content / Site.max_water_content * 100;
    
    this.getEvaporation = function(){
        this.saturated_vapour_pressure = this.calculateSaturatedVapourPressure(this.temperature);
        this.vapour_pressure_slope = this.calculateVapourPressureSlope(this.saturated_vapour_pressure, this.temperature);
        this.psychrometric_constant = this.calculatePsychrometricConstant(this.temperature);
        
        this.vapour_pressure = this.calculateVapourPressure(this.saturated_vapour_pressure, this.humidity);
        this.net_emissivity = this.calculateNetEmissivity(this.vapour_pressure);
        this.latent_heat = this.calculateLatentHeat(this.temperature);
        this.extraterrestrial_radiation = this.calculateExtraterrestialRadiation(this.date, this.Site.radians);
        this.net_radiation = this.calculateLongWave(this.temperature,this.Site.sunshine_duration,
            this.net_emissivity,this.latent_heat)  + this.calculateShortWave(this.Site.sunshine_duration,
            this.extraterrestrial_radiation);
            
        this.soil_heat_flux = this.calculateSoilHeatFlux(this.latent_heat, this.temperature_deficite);
        this.psychrometric_constant_velocity = this.calculatePsychrometricConstantVelocity(this.psychrometric_constant
            ,this.velocity);
        this.vapour_pressure_deficite = this.saturated_vapour_pressure - this.vapour_pressure;
        
        /* get potential evaporation */
        this.pot_evaporation = this.calculatePotEvaporation(this.vapour_pressure_slope,
            this.psychrometric_constant,this.net_radiation,this.soil_heat_flux,this.psychrometric_constant_velocity,
            this.temperature,this.velocity,this.vapour_pressure_deficite);
            
        /* get evaporation */
        this.evaporation = this.calculateEvaporation(this.pot_evaporation, this.soil_moisture, 
            this.Site.porosity, this.Site.residual_soil_moisture);
            
        return this.evaporation;
    };
    
    /**
     * Evaporation Protype Collection method
     * calculates evaporation normalized by the actual soil moisture from 
     * potential possible evaporation. This can only be reached at 100% soil 
     * moisture, as the soil is dry (residual), so evaporation can take place.
     * 
     * @param {float} pot_evaporation in [mm/d]
     * @param {float} soil_moisture in [%]
     * @param {float} porosity in [cm3/cm3]
     * @param {float} residual_soil_moisture in absolute mm
     * @return {float} evaporation in [mm/d]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */        
    this.calculateEvaporation = function(pot_evaporation, soil_moisture, porosity, residual_soil_moisture){
        /*actual_mositure is given in decimal value as the water content of the whole ground
	  all variables have to be transformed from percentage value to decimal value*/
	var actual_moisture = (soil_moisture / 100) * (porosity / 100);
	var term1 = (actual_moisture - (residual_soil_moisture / 100)) / ((porosity / 100) - (residual_soil_moisture / 100));
	var evaporation = Math.pow(term1, 0.5) * pot_evaporation;
        
        return evaporation;
    };
    
    /**
     * Evaporation Protype Collection method
     * calculates evaporation using the panman-monteith equation. This is a wind
     * velocity corrected reference evaporation. The Evaporation Protoype Collection
     * serves functions to calculate all parameter only from temperature, humidity,
     * wind velocity and latitude
     * 
     * @param {float} vapour_pressure_slope of vapour pressure curve in [kPa/deg. C]
     * @param {float} psychrometric_constant in [kPa/deg. C]
     * @param {float} net_radiation in [mm/d]
     * @param {float} soil_heat_flux in [mm/d]
     * @param {float} psychrometric_constant_velocity wind corrected constant in [kPa/deg.C]
     * @param {folat} temperature in [deg.C]
     * @param {float} velocity in [m/s]
     * @param {type} vapour_pressure_deficite in [Pa]
     * @return {float} pot_evaporation in [mm/d]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */        
    this.calculatePotEvaporation = function(vapour_pressure_slope,psychrometric_constant,net_radiation,soil_heat_flux,
        psychrometric_constant_velocity,temperature,velocity,vapour_pressure_deficite){
        var pot_evaporation = (vapour_pressure_slope/(vapour_pressure_slope + psychrometric_constant) *
		(net_radiation - soil_heat_flux) + (psychrometric_constant / (vapour_pressure_slope +
		psychrometric_constant_velocity)) * 900 / (temperature + 275) * velocity * vapour_pressure_deficite);
        
        return pot_evaporation;

    };

    /**
     * Evaporation Protype Collection method
     * calculates the slope of vapour pressure in the atmosphere for given
     * actual vapour pressure and the temperature
     * 
     * @param {folat} temperature in [deg.C]
     * @param {float} saturated_vapour_pressure in [kPa/deg. C]
     * @return {float} vapour_pressure_slope in [kPa/deg. C]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */        
    this.calculateVapourPressureSlope = function(saturated_vapour_pressure, temperature){
        var vapour_pressure_slope = (4098 * saturated_vapour_pressure) / Math.pow((237.3 + temperature), 2);
        
        return vapour_pressure_slope;

    };
    
    /**
     * Evaporation Protype Collection method
     * calculates the saturated vapour pressure in the atmosphere for given
     * temperature
     * 
     * @param {folat} temperature in [deg.C]
     * @return {float} vapour_pressure in [kPa/deg. C]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */            
    this.calculateSaturatedVapourPressure = function(temperature){
         var saturated_vapour_pressure =0.6108 * Math.exp((17.27 * temperature) / (237.3 + temperature));
         
         return saturated_vapour_pressure;
    };

    /**
     * Evaporation Protype Collection method
     * calculates the psychrometric constant in the atmosphere using the latent
     * heat of the atmosphere and its temperature. This could be extended by air
     * pressure in later versions
     * 
     * @param {folat} temperature in [deg.C]
     * @return {float} psychrometric_constant in [kPa/deg. C]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */        
    this.calculatePsychrometricConstant = function(temperature){
        var pressure = 101.3;
        /* get the latent heat first */
        var latent_heat = 2.501 - (0.002361 * temperature);
        
        /* then calculate psy. constant */
        var psychrometric_constant = 0.0016286 * (pressure / latent_heat);
        
        return psychrometric_constant;
    };
    
    /**
     * Evaporation Protype Collection method
     * influence the psychrometric constant with given wind velocity
     * 
     * @param {folat} psychrometric_constant in [kPa/deg.C]
     * @param {float} velocity in [m/s]
     * @return {float} psychrometric_constant_velocity in [kPa/deg. C]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */    
    this.calculatePsychrometricConstantVelocity = function(psychrometric_constant, velocity){
        var psychrometric_constant_velocity = psychrometric_constant * (1 + 0.33 * velocity);
        
        return psychrometric_constant_velocity;
    };
    
    /**
     * Evaporation Protype Collection method
     * calculates the long wave radiation losses of the atmosphere. First 
     * calculates latent from given temperature.  
     * 
     * @param {folat} temperature in deg. C]
     * @param {folat} sunshine_duration dimensionless Site constant
     * @param {float} net_emissivity in [?/?]
     * @param {float} latent_heat in [?/?]
     * @return {float} long_wave in [mm/d]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */               
    this.calculateLongWave = function(temperature,sunshine_duration,net_emissivity,latent_heat){
        /* get the cloud cover first */
        var cloud_cover = 0.9 * sunshine_duration + 0.1;
        
        /* then long wave radiation */
        var long_wave = - cloud_cover * net_emissivity * 4.903 * Math.pow(10, -9)
                * Math.pow((temperature + 273.2), 4) * (1 / latent_heat);
        
        return long_wave;

    };
    
    /**
     * Evaporation Protype Collection method
     * calculates the atmospheres latent heat from given temperature   
     * 
     * @param {folat} temperature in deg. C]
     * @return {float} latent_heat in [deg. C]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */                   
    this.calculateLatentHeat = function(temperature){
        var latent_heat = 2.501 - (0.002361 * temperature);
        
        return latent_heat;
    };

    /**
     * Evaporation Protype Collection method
     * calculates the atmospheres netto emissivity from actual vapour pressure  
     * 
     * @param {folat} vapour_pressure in [kPa/deg. C]?
     * @return {float} net_emissivity in [kPa/deg. C]?
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */                   
    this.calculateNetEmissivity = function(vapour_pressure){
        var net_emissivity = 0.34 - 0.14 * Math.pow(vapour_pressure, 0.5);
        
        return net_emissivity;
    };

    /**
     * Evaporation Protype Collection method
     * calculates actual vapour pressure in the atmosphere by relating the air
     * humidity to saturated vapour pressure in the atmosphere  
     * 
     * @param {folat} saturated_vapour_pressure in [kPa/deg. C]?
     * @param {float} humidity in [%]
     * @return {float} vapour_pressure in [kPa/deg. C]?
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */                   
    this.calculateVapourPressure = function(saturated_vapour_pressure, humidity){
        var vapour_pressure = saturated_vapour_pressure * (humidity / 100);
        
        return vapour_pressure;
    };
    
    
    /**
     * Evaporation Protype Collection method
     * calculates the short wave radiation income to the atmosphere from 
     * extraterrestrial radiation limited by the sunshine duration
     * 
     * @param {folat} sunshine_duration dimensionless Site constant
     * @param {float} extraterrestrial_radiation in [mm/d]
     * @return {float} short_wave in [mm/d]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */                       
    this.calculateShortWave = function(sunshine_duration,extraterrestrial_radiation){
        var short_wave = (0.25 + 0.5 * sunshine_duration) * extraterrestrial_radiation;
        
        return short_wave;
    };
    
    /**
     * Evaporation Protype Collection method
     * calculates extraterrestrial radiation for a specific date and radians.
     * makes use of the dayOfYear method
     * 
     * @see dayOfYear
     * @param {Date} date instance of Date class
     * @param {float} radians in [deg. rad]
     * @return {float} extraterrestrial_radiation in [mm/d]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */   
    this.calculateExtraterrestialRadiation = function(date, radians){
        /*relative distance to the sun compared to an unic distance is needed*/
	var distance = 1 + 0.033 * Math.cos((this.dayOfYear(date) / 365) * 2 * Math.PI);
        
        /* get solar declination depending on julian day number*/
        var solar_declination = 0.4093 * Math.sin((this.dayOfYear(date) / 365) * 2 * Math.PI - 1.405);
	
        /* get angle of sunset for given solar declination */
        var sunset_hour_angle = Math.acos(- Math.tan(radians) * Math.tan(solar_declination));
        
        /* calculate radiation for given solar constellation depending on julian day number */
	var extraterrestrial_radiation = 15.392 * distance * ((sunset_hour_angle * Math.sin(radians)
			* Math.sin(solar_declination)) + (Math.cos(radians) * 
                        Math.cos(solar_declination) * Math.sin(sunset_hour_angle)));
	
        return extraterrestrial_radiation;
    };

    /**
     * Evaporation Protype Collection method
     * calculates the soil heat flux depending on the latent heat of the 
     * atmosphere. The soil heat flux is estimated from a temperature deficite
     * meaning the difference in temperature betwenn this and the previous 
     * timestep. THis is optinal, if not given or not a number, soil heat flux 
     * will be 66% of the atmospheres latent heat.
     * 
     * @param {float} latent_heat in [deg. C]
     * @param {float} temperature_deficite optional parameter in [K]
     * @return {float} soil_heat_flux in [mm/d]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */   
    this.calculateSoilHeatFlux = function(latent_heat, temperature_deficite){
        var soil_heat_flux;
        if (typeof temperature_deficite === "undefined" || temperature_deficite === null){
            soil_heat_flux = 0.66 * latent_heat;
        }
        else {
            soil_heat_flux = 0.38 * temperature_deficite / latent_heat;
        }
        
        return soil_heat_flux;
    };
    
    /**
     * Evaporation Protype Collection method
     * returns the number of day in the year from the given Date value.
     * Date has to be an instance of Date class 
     * 
     * @see Date
     * @param {Date} date Instance of Date to use
     * @return {int} days 
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */                           
    this.dayOfYear = function(date){
	/** returns the number of day in the year. date has to be an instance of
	    class Date*/
	var days = - 1;
	for (var i = 1; i < (date.getMonth() + 1); i++){
		days += (new Date(date.getFullYear(), (i +1), 0).getDate());
	}
	days += date.getDate() + 1;
	
	return days;
}
}


