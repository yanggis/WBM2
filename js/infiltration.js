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

/** 
 * Inflitration Prototype Collection
 * Calculates simple balance based daily infiltration rates, depending on static
 * infiltration capacity and interception for given Site and precipitation 
 * Site has to have WBM2 format. All methods can
 * be used independendly to calculate hydrological parameter. 
 * @see core.js
 * 
 * @param {float} precipitation in [mm/d]
 * @param {integer} water_content  in absolute mm
 * @param {Site} Site Site Object defined in core.js
 * @version 2.0 alpha
 * @author Mirko Maelicke <mirko@maelicke-online.de>
 */
function Infiltration(precipitation, water_content, Site){
    /* input Objects */
    this.precipitation = precipitation;
    this.water_content = water_content;
    this.Site = Site;
    
    this.getInfiltration = function(){
        this.actual_precipitation = this.calculateActualPrecipitation(this.precipitation, this.Site.interception);
        this.infiltration = this.calculateInfiltration(this.actual_precipitation, this.Site.infiltration_capacity,
            this.water_content, this.Site.max_water_content);
        return this.infiltration;
        
    };

    /**
     * Infiltration Protype Collection method
     * calculates actual precipitation from static interception
     * 
     * @param {float} precipitation in [mm]
     * @param {float} interception static, in [mm]
     * @return {float} actual precipitation in [mm]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */
    this.calculateActualPrecipitation = function(precipitation, interception){
        var actual_precipitation = precipitation - interception;
        
        if (actual_precipitation < 0){
            actual_precipitation = 0;
        }
        
        return actual_precipitation;
    };
    
    /**
     * Infiltration Protype Collection method
     * calculates horton discharge from static infiltration capacity and actual
     * precipitation 
     * 
     * @param {float} actual_precipitation in [mm/d]
     * @param {float} infiltration_capacity static, in [mm/d]
     * @return {float} horton_discharge in [mm/d]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */    
    this.calculateHorton = function(actual_precipitation, infiltration_capacity){
        if (actual_precipitation > infiltration_capacity){
            horton_discharge = actual_precipitation - infiltration_capacity;
        }
        else {
            horton_discharge = 0;
        }
        
        return horton_discharge;
    };
    
    /**
     * Infiltration Protype Collection method
     * calculates infiltration based on a static infiltration capacity and actual
     * precipitation. Infiltration will only continue until max water content is
     * reached. To get the losses use calculateHorton()
     * 
     * @param {float} actual_precipitation in [mm/d]
     * @param {float} infiltration_capacity static, in [mm/d]
     * @param {float} water_content in abolute mm
     * @param {float} max_water_content in absolute mm
     * @return {float} infiltration in [mm/d]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */        
    this.calculateInfiltration = function(actual_precipitation, infiltration_capacity,
        water_content, max_water_content){
        /* get the potential infiltration first*/
        if (actual_precipitation > infiltration_capacity){
           var pot_infiltration = infiltration_capacity;
        }
        else {
            var pot_infiltration = actual_precipitation;
        }
        
        /* get the actual infiltration */
        if (water_content + pot_infiltration > max_water_content){
            var infiltration = max_water_content - water_content;
        }
        else {
            var infiltration = pot_infiltration;
        }
        
        return infiltration;
    };
}

