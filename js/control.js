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

//$(document).ready(function(){
    /* to use this script, the global Stations Array need to be declared*/
//    viewerIDs = new Array(); Views = new Array();
    
    /* development */
    //Stations[0] = new Station(testData, [new Site()]);
    //Stations[1] = new Station(testData, [new Site()]);
    //testSite = new Site();
    /*testData = [{'temperature':14,'humidity':60,'precipitation':5.6,'velocity':1.4,'date':'May 14, 2013'},
        {'temperature':13,'humidity':50,'precipitation':4.3,'velocity':1.6,'date':'May 15, 2013'},
        {'temperature':19,'humidity':55,'precipitation':9.1,'velocity':1.9,'date':'May 16, 2013'},
        {'temperature':15,'humidity':71,'precipitation':1.1,'velocity':0.3,'date':'May 17, 2013'}];*/
    //testStation = new Station(testData, testSite);
    //testView = new Viewer(testStation, $('#main'));
    
    //$('.vw_slide').bxSlider({
    //    adaptiveHeight: true
    //});
    
    /* test of PageRenderer */
    //pages = stationPageTitle();
    
//    pages.push(
//        {
//            'title':'help',
//            'type':'plain',
//            'content':'<h1>I am a rendered Help page</h1>'
//        }
//    );
//    /* initialize page Renderer */
//    pageRenderer = new PageRenderer(pages);
//    
//    /* create station record views */
//    $.each(Stations, function(i,station){
//       Views[i] = new Viewer(station,$(viewerIDs[i])); 
//    });
//    
//    /* create box Slider */
//    $('.vw_slide').bxSlider({
//        adaptiveHeight: true
//    });
//    
//    /* hide all but the first page*/
//    $.each(pages, function(i,page){
//        if (i !== 0)
//        $('#'+page['name']+i).css('display','none');
//    });
//    
//    CKEDITOR.replace('editor1');
//});

function PageRenderer(pages){
    this.pages = pages;

    if (!$.isArray(pages)){
        this.renderStartpage('main');
    }
    else {
        $.each(pages, function(i,page){
            /* create link */
            $('#tab_menu').html($('#tab_menu').html() + 
                    '<li id="li_'+page['name']+i+'" class="inactive">'
                    +'<a href="javascript:pageRenderer.switchPage(\''+page['name']+i+'\');">'+page['title']+'</a></li>');
            /* create body */
            $('#main').html($('#main').html() + '<div class="mainView" id="'+page['name']+i+'"></div>');
            if (page['type'] === 'station'){
                /* reference view IDs for table Viewer*/
                viewerIDs.push('#'+page['name']+i);
            }
            else {
                $('#'+page['name']+i).html(page['content']);
            }
        });
        /* make first tab active */
        $('#li_'+pages[0]['name']+'0').attr('class','active');
    }
    
    this.switchPage = function(LoadPage){
        $.each(this.pages, function(i,page){
            $('#'+page['name']+i).css('display','none');
            $('#li_'+page['name']+i).attr('class','inactive');
        });

        $('#'+LoadPage).slideToggle();
        $('#li_'+LoadPage).attr('class','active');
        
    };
    
    this.renderStartpage = function(DOMLocation){
        $('#'+DOMLocation).html('<h1>Welcome</h1><h2>to WBM 2.0 development page</h2>');
    }; 
}

function stationPageTitle(){
    var rArray = new Array();
    $.each(Stations, function(i,station){
        rArray.push({'title':station.title, 'name':station.name, 'type':'station'});
    });
    
    return rArray;
}
