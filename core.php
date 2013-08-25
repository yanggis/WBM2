<?php
/**
 * This function uses the global stations array as well as its iterator stationsIndex
 * meta information is 
 *
 * @author mirko_000
 */
function load_station_mysql($conn,$station_id){
    /* constructor of Station requires: data[], Site[], meta{} */
    /*load Data*/
    $query  = "SELECT station_id, Year(mydate) as year, MONTH(mydate) as month,
        DAY(mydate) AS day, AVG(IF(type = 'humidity', VALUE, NULL)) As humidity,
        AVG(IF(type = 'pressure', VALUE, NULL)) As pressure,
        AVG(IF(type = 'temperature', VALUE, NULL)) As temperature,
        SUM(IF(type = 'precipitation', VALUE, NULL)) As precipitation FROM timeseries
        where station_id = $station_id
        GROUP BY station_id,year,month,day ORDER BY 'month','day' ASC";
    $res = mysqli_query($conn, $query);
    
    echo "<script type='text/javascript'>\n";
    echo 'Stations[stationsIndex++] = new Station([';

    while (($row = mysqli_fetch_assoc($res)) !== NULL){
        $date = mktime(12, 0, 0, (int)$row['month'], (int)$row['day'], (int)$row['year']);
        if (!isset($row['recipitation'])){ $row['precipitation'] = 0; }
        echo "{'date':".($date*1000).", 'temperature':".(float)$row['temperature'].
                ",'precipitation':".(float)$row['precipitation'].
                ",'humidity':".(float)$row['humidity'].",'velocity':1.0},";
    }
    echo "],[";
    /* load all sites */
    $i = 0;
    $sites_res = mysqli_query($conn, "select content from site where station_id=$station_id");
    while (($site = mysqli_fetch_assoc($sites_res)) !== NULL){
        echo "{$site['content']},";
        $i++;
    }
    if ($i === 0){
        echo "new Site()]\n";
    }else {
        echo "]\n";
    }
    
    
    $query = "Select * from stations where station_id=$station_id";
    $res = mysqli_query($conn, $query);
    if (($meta = mysqli_fetch_assoc($res)) !== FALSE){
        echo ",".  json_encode($meta).");\n";
    }
    else {
        echo ");";
    }
    echo "pages.push({'title':'{$meta['title']}','name':'{$meta['name']}','type':'station'});";
    echo "</script>\n";
}

function load_page_mysql($conn, $page_id, $db='pages'){
    /* if there was a page, return the page, else return FALSE (important!) */
    if(($result = mysqli_query($conn,"select * from $db where name='$page_id'")) !== FALSE){
        if (($page = mysqli_fetch_assoc($result)) !== NULL){
            return array(
                'title'=>$page['title'],
                'name'=>$page['name'],
                'type'=>'plain',
                'content'=>$page['content'],
                'category'=>$page['category'],
            );
        }
        else {
            return false;
        }
    }
    else{
        /* replace this with direct to 404 */
        return false;
    }
}

function load_page_PHPFile($pagename, $params = NULL){
    /* to do: insert try_catch and direct to 404 if catched */
    /* require the page and create pages entry */
    ob_start();
    require_once 'bin/pages/pages_'.$pagename.'.php';
    $content = ob_get_contents();
    ob_end_clean();
    
    //check if a page title was passed
    if (isset($title)){
        $pagetitle = $title;
    }
    else { $pagetitle = $pagename; }
    
    //check if a page type was passed
    if (isset($type)){
        $pagetype = $type;
    }
    else { $pagetype = 'plain'; }
    
    //check for page category
    if (isset($category)){
        $pagecategory = $category;
    }
    else { $pagecategory = 'unindexed'; }
    
    //check if page has a onload function
     if (isset($onload)){
         if (isset($_SESSION['onload'])){
             array_push($_SESSION['onload'], $onload);
         }
         else {
             $_SESSION['onload'] = array($onload);
         }
   }
   
    return  array(
        'title'=>$pagetitle,
        'name'=>$pagename,
        'type'=>$pagetype,
        'content'=>$content,
        'category'=>$pagecategory
    ); 
}

function load_page_txtFile($filePath){
    
}

function load_page_PHPFunction($pagename, $args = NULL){
    /* to do: insert try_catch and direct to 404 if catched */
    /* require the page and run the function */
    $function = 'pages_'.$pagename;
    require_once 'bin/pages/pages_'.$pagename.'.php';
    
    $result = $function($args);
    
    return $result;
}

function login($conn, $username, $password){
    if (($user_res = mysqli_query($conn, "select * from user where username='$username'")) !== FALSE){
        if (($user = mysqli_fetch_assoc($user_res)) !== NULL){
            if ($user['password'] == md5($password)){
                /* login complete!*/
                $_SESSION['user'] = $user['username'];
                $_SESSION['login'] = 'accept';
                $_SESSION['role'] = $user['role'];
                $_SESSION['user_id'] = $user['user_id'];
                
                if (isset($user['groups'])){
                    $groups = explode(',', $user['groups']);
                    $_SESSION['groups'] = $groups;
                    
                }
                
                return true;
            }
            else {
                /* redirect to 404 page here, password incorrect */
                //echo 'password wrong';
                return false;
            }
        }
        else {
            /* redirect to 404 page here, user not found */
            //echo 'user not found';
            return false;
        }
    }
    else {
        /* redirect to 404 page here conn problems*/
        //echo 'connection not found';
        return false;
    }
}

function logout(){
    session_destroy();
    
    /* after logout restart the session for guest access*/
    session_start();
    $_SESSION['database'] = 'wbm2';
    $_SESSION['conn'] = mysqli_connect("localhost", "ncms", "HydroDyck", $_SESSION['database']);
}

function handlePageRequest(){
    /* if a GET isset and GET is station, then load station from database */
    if (isset($_GET['station'])){
        /* pass it to the session */
        if (isset($_SESSION['stations'])){
            array_push($_SESSION['stations'],$_GET['station']);
        }
        else { $_SESSION['stations'] = array($_GET['station']); }
    }

    /* if a GET isset and Get is page then load page from any source */
    if (isset($_GET['page'])){
        /* check security state */
        if (($res = mysqli_query($_SESSION['conn'], 
                "Select view_permission from permissions where page_name='{$_GET['page']}'")) !== FALSE){
            if (($row = mysqli_fetch_row($res)) !== NULL){
                $tablerole = $row[0];
                //$tablerole = 'guest';  //insert sql request
                if ($_SESSION['hierachy'][$_SESSION['role']] >= $_SESSION['hierachy'][$tablerole]){
                    /* check for php file */
                    if(file_exists('bin/pages/pages_'.$_GET['page'].'.php')){
                        if (isset($_SESSION['pages'])){
                            array_unshift($_SESSION['pages'], load_page_PHPFile($_GET['page'], array('conn'=>$_SESSION['conn'])));
                        }
                        else {
                            $_SESSION['pages'] = array(load_page_PHPFile($_GET['page'], array('conn'=>$_SESSION['conn'])));
                        }
                    }
                    
                    elseif (($page_res = load_page_mysql($_SESSION['conn'], $_GET['page'])) !== false){
                        if (isset($_SESSION['pages'])){
                            array_unshift($_SESSION['pages'], $page_res);
                        }
                        else {
                            $_SESSION['pages'] = array($page_res);
                        }
                    }
                    
                    /* search the page in the usergroup table */
                    elseif (isset($_SESSION['groups'])){
                        foreach ($_SESSION['groups'] as $group){
                            if (($page_res = load_page_mysql($_SESSION['conn'], $_GET['page'], $group)) !== false){
                                /* load the page from db with name group. */
                                if (isset($_SESSION['pages'])){
                                    array_unshift($_SESSION['pages'], $page_res);
                                }
                                else {
                                    $_SESSION['pages'] = array($page_res);
                                }
                            }
                        }
                    }
                }
            }
            else { /*handle all the else: conn not found; page not found; access denied etc.*/ }
        }
    }

    /* after creating all pages from requests check if a page will be rendered
     *  if not: render startpage
     */
    if(!isset($_SESSION['pages'])){
        $_SESSION['pages'] = array(load_page_PHPFile('startpage',array('conn'=>$_SESSION['conn'])));
    }

}


function parsePageToRenderer(){
    /* pass saved pages to pageRenderer */
    if (isset($_SESSION['pages'])){
        echo '<script type="text/javascript">';
        foreach ($_SESSION['pages'] as $page){
            echo 'pages.push('.json_encode($page).');';
        }
        echo '</script>';

        //unlink the the pages from session
        //if (isset($_SESSION['login']) && $_SESSION['login'] !== 'accept'){
            unset($_SESSION['pages']);
        //}
    }

    /* load stations and pass stations to pageRenderer  */
    if (isset($_SESSION['stations'])){
        foreach ($_SESSION['stations'] as $station){
            load_station_mysql($_SESSION['conn'], $station);
        }
        if (isset($_SESSION['login']) && $_SESSION['login'] !== 'accept'){
            unset($_SESSION['stations']);
        }
    }
    
    if (isset($_SESSION['scripts'])){
        foreach ($_SESSION['scripts'] as $script){
            echo "<script type='text/javascript'>$script</script>";
        }
        uset($_SESSION['scripts']);
    }

}
?>
