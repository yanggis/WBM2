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
 * Percolation Prototype Collection
 * Calculates percolation using Van-Genuchten-Mualem model for given 
 * watercontent on a given Site. Site has to have WBM2 format. All methods can
 * be used independendly to calculate hydrological parameter. 
 * @see core.js
 * 
 * @param {integer} water_content  in absolute mm
 * @param {Site} Site Site Object defined in core.js
 * @version 2.0 alpha
 * @author Mirko Maelicke <mirko@maelicke-online.de>
 */
function Percolation(water_content, Site){
    /* attributes */
    this.water_content = water_content;
    this.Site = Site;
    this.soil_moisture = this.water_content / this.Site.max_water_content * 100;
    
    /* methods */
    this.getPercolation = function(){
        this.hydraulic_conductivity = this.calculateHydraulicConductivity(this.soil_moisture,
            this.Site.porosity, this.Site.lambda, this.Site.residual_soil_moisture,
            this.Site.saturated_hydraulic_conductivity);
        this.percolation = this.calculatePercolation(this.hydraulic_conductivity);
        
        return this.percolation;
    };
    
    /**
     * Percolation Protype Collection method
     * calculates percolation from given hydraulic conductivity
     * 
     * @param {float} hydraulic_conductivity in [cm/h]
     * @return {float} percolation in [mm/d]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */
    this.calculatePercolation = function(hydraulic_conductivity){
        var percolation = hydraulic_conductivity * 240;
        
        return percolation;
    };

    /**
     * Percolation Protype Collection method
     * calculates hydraulic conductivity for given soil parameters
     * 
     * @param {float} soil_moisture in [%]
     * @param {float} porosity in [cm3/cm3]
     * @param {float} lambda pore size index relation between small and big pores 
     *      between 0 and 1
     * @param {float} residual_soil_moisture in [cm3/cm3]
     * @param {float} saturated_hydraulic_conductivity in [cm/h]
     * @return {float} hydraulic conductivity in [cm/h]
     * @version 2.0
     * @author Mirko Maelicke <mirko@maelicke-online.de>
     */
    this.calculateHydraulicConductivity = function(soil_moisture, porosity,lambda,
        residual_soil_moisture, saturated_hydraulic_conductivity){
        
	var actual_moisture = (soil_moisture / 100) * (porosity / 100);
	var m = (lambda / (1 + lambda));
	
	/*term 1 is needed twice in Van Genuchten equation; term2 is seperated because of planty Math.pow use*/
	
	var term1 = (actual_moisture - (residual_soil_moisture / 100)) / ((porosity / 100) - (residual_soil_moisture / 100));
	var term2 = Math.pow(1 - Math.pow(1 - Math.pow(term1, (1 / m)), m), 2);
	var hydraulic_conductivity = Math.pow(term1, 0.5) * term2 * (saturated_hydraulic_conductivity * 100 * 3600);
        
        return hydraulic_conductivity;

    };
}

