<%@ page contentType="text/html;charset=UTF-8" language="java" %>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>NoteCloud</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">

    <!-- Le styles -->
    <link href="css/bootstrap.css" rel="stylesheet">
    <link href="css/font-awesome.css" rel="stylesheet">
    <style>
      body {
        padding-top: 60px; /* 60px to make the container go all the way to the bottom of the topbar */
      }
    </style>
    <link href="css/bootstrap-responsive.css" rel="stylesheet">
    <link href="css/app.css" rel="stylesheet">

    <!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
      <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <!-- Le fav and touch icons -->
    <link rel="shortcut icon" href="../assets/ico/favicon.ico">
    <link rel="apple-touch-icon-precomposed" sizes="144x144" href="img/ico/apple-touch-icon-144-precomposed.png">
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="img/ico/apple-touch-icon-114-precomposed.png">
    <link rel="apple-touch-icon-precomposed" sizes="72x72" href="img/ico/apple-touch-icon-72-precomposed.png">
    <link rel="apple-touch-icon-precomposed" href="img/ico/apple-touch-icon-57-precomposed.png">
  </head>

  <body ng-cloak ng-app="app">

    <div class="navbar navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container">
          <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </a>
          <a class="brand" href="#">NoteCloud</a>
          <ul class="nav pull-right" ng-controller="UserCtrl">
            <li class="dropdown">
              <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                  {{user.email}}
                  <img class="profile-picture" src="{{user.picture}}"/>
              </a>
              <ul class="dropdown-menu">
                <li><a href="{{user.link}}" target="_blank">Profile</a></li>
              </ul>
            </li>
          </ul>          
        </div>
      </div>
    </div>
    <div ng-view></div>

    <div class="row editorHolder" ng-controller="UpdaterCtrl">
      <div class="arrow_box"></div>
      <div class="span1"><br></div>
      <div class="span6 fullHeight">
        <div>        
          <input id="titleBox" class="titleInput" type="text" placeholder="Add Title" on-keyup="updateSelectedBox()"></input>         
        </div>  
        <textarea on-keyup="updateSelectedBox()" id="editor" placeholder="Add Content" cloud-editor></textarea>
      </div>
      <div class="span6 sectionsHolder">
        <span class="titleInput addbutton" ng-click="addSection()">+ Add Section</span>
        <table class="bitOnRight">
          <tr><td class="minisection"/><td class="minisection"/><td class="minisection"/></tr>                  
          <tr ng-repeat="sectionrow in sections.data">
            <td class="minisection" ng-repeat="section in sectionrow">
              <div id={{section.id}} ng-click="setActive(section.id)" class="bordered" ng-class="{'emptycontent': section.emptyContent}">              
                <h3>{{section.title}}</h3>                                  
                <div>{{section.displayText}}</div>                
              </div>
            </td>
            <br>
          </tr>
        </table>
      </div>
      <div class="span1"><br></div>      
    </div>
    <alert id="error"></alert>

    <script src="lib/jquery/jquery-1.7.2.min.js"></script>
    <script src="lib/jquery/jqueryui-1.8.9.js"></script>
    <script src="lib/ace/ace.js" charset="utf-8"></script>
    <script src="https://apis.google.com/js/api.js"></script>
    <script src="https://www.google.com/jsapi"></script>
    <script src="lib/bootstrap/bootstrap.js"></script>
    <script src="lib/angular-1.0.0/angular-1.0.0.js"></script>
    <script src="js/app.js"></script>
    <script src="js/services.js"></script>
    <script src="js/controllers.js"></script>
    <script src="js/filters.js"></script>
    <script src="js/directives.js"></script>

  </body>
</html>