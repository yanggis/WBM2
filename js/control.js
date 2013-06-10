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

/*
 * This is a default array of testing Values without any meaning.
 * WBM2 does not provide any graphical output so far and does not support any kind
 * of data import so far.
 * the data has to have testData JSON format.
 * use fireburg to inspect testStation Object. As the model is working, each point
 * of the station should contain calculated properties e.g. infiltration. 
 */
$(document).ready(function(){
    testSite = new Site();
    testData = [{'temperature':14,'humidity':60,'precipitation':5.6,'velocity':1.4,'date':'May 14, 2013'},
        {'temperature':13,'humidity':50,'precipitation':4.3,'velocity':1.6,'date':'May 15, 2013'},
        {'temperature':19,'humidity':55,'precipitation':9.1,'velocity':1.9,'date':'May 16, 2013'},
        {'temperature':15,'humidity':71,'precipitation':1.1,'velocity':0.3,'date':'May 17, 2013'}];
    testStation = new Station(testData, testSite);
});
