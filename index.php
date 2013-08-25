<?php
session_start();

/* load the CMS core to index page */
require_once 'core.php';

/* read databse information from conf.ini */
$conf_array = parse_ini_file('conf.ini');
$_SESSION['database'] = $conf_array['database'];
$_SESSION['conn'] = mysqli_connect($conf_array['server'], $conf_array['user'], $conf_array['password'], $_SESSION['database']);
$_SESSION['hierachy'] = array('guest'=>0,'user'=>1,'editor'=>2,'admin'=>3);

/* check login state */
if (isset($_POST['username'])){
    login($_SESSION['conn'], $_POST['username'], $_POST['password']);
}
if (isset($_GET['logout'])){
    logout();
}

/* remove this to core api */
if (isset($_SESSION['user'])){
    /* user or guest; existing session */
    if (isset($_SESSION['login']) && $_SESSION['login'] === 'accept'){
        /* user is logged in*/
        /* DEV: as created redirect to user personalized starting page*/
        $_SESSION['stations'] = [1,2];
    }
}
else {
    /* load default startpage equal statement, to erase all existing page-load requests */
    //$_SESSION['pages'] = array(load_page_PHPFile('startpage',array('conn'=>$_SESSION['conn'])));
    
    /* set user as guest */
    $_SESSION['user'] = 'guest';
    $_SESSION['login'] = 'denied';
    $_SESSION['role'] = 'guest';
}

/* load all requested pages */
handlePageRequest();
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>WBM 2.0</title>
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"></script>
        <script src="js/bxslider/jquery.bxslider.js"></script>
        <script type="text/javascript" src="js/control.js"></script>
        <script type="text/javascript" src="js/core.js"></script>
        <script type="text/javascript" src="js/infiltration.js"></script>
        <script type="text/javascript" src="js/percolation.js"></script>
        <script type="text/javascript" src="js/evaporation.js"></script>
        <script type="text/javascript" src="js/ckeditor/ckeditor.js"></script>
        
        <!-- Use DataTables Package to view a station -->
       <script type="text/javascript" src="js/DataTables/media/js/jquery.dataTables.js"></script>
       <style type="text/css">
           @import "js/DataTables/media/css/jquery.dataTables.css";
           @import "bin/templates/wbm2/style.css";
           @import "js/bxslider/jquery.bxslider.css";
       </style>
       <script type='text/javascript'>
       /* Before uploading any stations and/or Data, the global Station array has to be
        * declared and the stationIndex iterator has to be published. Each PHP function
        * and/or other data source scripts should pass the created Stations into the
        * global stations Array 
        */
        Stations = new Array(); stationsIndex = 0; pages = new Array();
       </script>
        <?php parsePageToRenderer();?>
       
       <!-- global onload function, including site javascript -->
       <script type="text/javascript">
       $(document).ready(function(){
        viewerIDs = new Array(); Views = new Array();
           
        /* initialize page Renderer */
        pageRenderer = new PageRenderer(pages);

        /* create station record views */
        $.each(Stations, function(i,station){
           Views[i] = new Viewer(station,$(viewerIDs[i])); 
           /* reference the viewer to the station */
           station.viewer = Views[i].reference();
        });

        /* hide all but the first page*/
        $.each(pages, function(i,page){
            if (i !== 0)
            $('#'+page['name']+i).css('display','none');
        });
        <?php if (isset($_SESSION['onload'])){
            foreach ($_SESSION['onload'] as $onloadFunction){
                echo $onloadFunction;
            }
            unset($_SESSION['onload']);
        } ?>
       });
       </script>
    </head>
    <body>
        <div id="page">
            <div id='sidebar'>
                <?php require_once 'bin/templates/wbm2/sidebar.php';?>
            </div>

            <div id='header'>
                <?php require_once 'bin/templates/wbm2/header.php';?>
            </div>
            <div id="main">
                <ul id='tab_menu'></ul>
                <!--<div class='mainView' id='default'></div>-->
            </div>
            <div id='footer'>
                <?php require_once 'bin/templates/wbm2/footer.php';?>
            </div>
        </div>
    </body>
</html>
