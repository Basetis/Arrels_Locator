//production o develop
var entorno="production";
//var entorno="develop";

var config={};

var url_destino_arrels = "";
var url_basetis = "";
var url_arrels = "";
var exception = false;
var geocoder;
var geo;
var map;
var latlng;
var transition = false;
var counterCode = 0;
var code_info={};
var codes_url;
//control de Cards
var current_card = 0;
var cards = ["personas", "primera_vez", "donde_duermen", "animales", "observaciones","gracias"];
var online = true;
var text_location="";
var address_components={};
var answer={};
var slickMan;
var slickWoman;
var slickIndet;
var elemento1;
var elemento2;
var elemento3;
var marker = {
            lat: 41.3947901,
            lng: 2.1487679,
            draggable: true,
            animation: google.maps.Animation.DROP,  
            dragend:function(event){
                map.markers[0].position = event.latLng;
                console.log(event.latLng);
                console.log(map.markers[0].position);
            }         
        };
/////////////////////////////////////////FIREBASE/////////////////////////////////////////
var firebaseApp = {};
var firebaseDB = {};
//////////////////////////////////////////////////////////////////////////////////////////


function init(){
    initializeFirebase();
    getFirebaseConfig(function(){
        setLanguage(initApp);
    });
}

function initForm(){   
    $('#header').show();
    current_card=0;
    $('.materialize-textarea').val("");   
    $('.tarjeta').hide();
    $('#map').show(); 
    if(typeof map === 'undefined') location.reload();
    else map.refresh();       
    $('#footer').show();
    $('#boton_localiza').show();
    $('#geocodeForm').show();
    $('.fa-search').show();
    if(entorno == "develop"){
        $('#redSquare').show();
    }else{
        $('#redSquare').hide();
    }
}

/////////////////////////////////////////FIREBASE/////////////////////////////////////////
function initializeFirebase() {
    if(jQuery.isEmptyObject(firebaseDB)) {
        var config = {
            apiKey: "FIREBASE_API_KEY",
            authDomain: "FIREBASE_AUTH_DOMAIN",
            databaseURL: "FIREBASE_DATABASE_URL",
            storageBucket: "FIREBASE_STORAGE_BUCKET",
        };
        firebaseApp = firebase.initializeApp(config);
        firebaseDB = firebaseApp.database();
    }
}

function firebaseError(err) {
    console.log("Firebase ERROR: "+err);
}

function getFirebaseConfig(callback) {
    var configuration = [];
    firebaseDB.ref("CustomParams").once("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var key = childSnapshot.key;
            var val = childSnapshot.val();
            var obj = { "key": key, "value": val.value, "value_dev": val.value_dev };
            configuration.push(obj);
        });
        config = configuration;
        $.each(config,function(index, value){
               if(value.key=="url_destino") {
                    url_destino_arrels = getConfigValue(value);
                    console.log("url_Arrels1",url_destino_arrels);
                }
                else if(value.key=="url_basetis") {
                    url_basetis = getConfigValue(value);
                    console.log("url_basetis 1",url_basetis);
                }
                else {
                    url_arrels = getConfigValue(value);
                    console.log("url_basetis 2",url_arrels);
                }
            });      
            exception = true;
            callback();
        }, firebaseError);
}


function checkAPI(callback) {
    initializeFirebase();
    getFirebaseConfig(callback);
}
//////////////////////////////////////////////////////////////////////////////////////////


function getConfigValue(value){
    if(entorno == "develop"){
        return value.value_dev;
    }else{
        return value.value;
    }
}

function isOnline(){
    console.log("isOnline");
    var  data = localStorage.getItem('unRegistred');
    if (data){
        console.log("Hay datos para sync");
        syncForm();
        
    }else{
        console.log("No hay datos para sync");
    } 
    if($('#map').is(':visible') && (typeof map ==='undefined')){
        location.reload();
    }
    online = true;
}
function setLanguage(callback){
    /*default*/
    var url="js/lang/lang_es.js";
     console.log('url',url);
    
    navigator.globalization.getPreferredLanguage(
        function (language) {
            //console.log('language: ' + language.value + '\n');

            //parseo de idiomas
            var idioma = language.value.toUpperCase();
            
            if(idioma.indexOf("ES-")>-1){
                //español (puede haber latino o variedades)
                url="js/lang/lang_es.js";
            }else if(idioma=="ES"){
                //español
                url="js/lang/lang_es.js";
            }else if(idioma=="CA-ES"){
                //catalan
                url="js/lang/lang_cat.js";
            }else if(idioma=="FR"){
                //french
                url="js/lang/lang_fr.js";
            }else if(idioma.indexOf("FR-")>-1){
                //french
                url="js/lang/lang_fr.js";
            }else if(idioma.indexOf("EN-")>-1){
                url="js/lang/lang_en.js";
            }        
            $.getScript( url, function( data, textStatus, jqxhr ) {
                callback();
            });
        },
        function () {
            $.getScript( url, function( data, textStatus, jqxhr ) {
                callback();
            });
        }
    );
  
}
function renderPage(){
    //primero template
    //segundo contenedor
    renderTemplate($("#arrels-template"), $("#contenedor-arrels-template"), lang);
    $('#fondo').css("height",$('.carrouserl_hombres').height());
}

function onBackKeyDown(){
    //si ha pasado al formulario
    if($('#'+cards[current_card]+' #header #back').is(":visible")){
        backCard();  
        if(($('#map').is(':visible'))&& (typeof map !== 'undefined')){
            initForm();
        }
        else if ((typeof map === 'undefined') && (online == true)){
            location.reload();
        }  
    }    
    else if($('#message-popUp').is(":visible")){
        $('#overlay-popUp').hide();
        $('#message-popUp').hide();
    }else if($('.tarjeta#about').is(":visible")){
        $('.tarjeta#about').hide();
        $('#popUp-code').hide();
        $('#pagina_inicial').show();
        $('#geocodeForm').show();
        $('#pagina_inicial').show();
        resetForm();
        check_if_location();
        map.refresh();
    }else if($('.tarjeta#gracias').is(":visible")){
        map.refresh();
        initForm();
        resetForm();
        check_if_location();
    
    }else if(!$('#message-popUp').is(":visible") && $('#pagina_inicial').is(":visible")){
        navigator.app.exitApp();
    }else{
        navigator.app.exitApp();
    }
    
}
function check_if_location(){
    cordova.plugins.diagnostic.isLocationEnabled(function(enabled){
        if(!enabled){
            $('#overlay-popUp').show();
            $('#message-popUp-GPS').show();
        }
    }, function(error){
        console.log("No diagnostic");
    });
}
function initApp(){

    //alert(device.platform + " " + device.uuid +" "+ device.version +" "+ device.model);
    //console.log(device.platform + " " + device.uuid +" "+ device.version +" "+ device.model);

        elemento1=0;
        elemento2=0;
        elemento3=0;
        //comprovamos si esta activo el GPS
        check_if_location();    	
        if(!localStorage.getItem('firstStart')){
            $('#overlay-popUp').show();
            $('#message-popUp').show();
            localStorage.setItem('firstStart','true');
        }

        if (typeof device !== "undefined" && device.platform == "Android") {
            geo = cordova.plugins.locationServices.geolocation;
        } else {
            geo = navigator.geolocation;
        }       
        document.addEventListener("backbutton", onBackKeyDown, false);
        document.addEventListener("online", isOnline, false);
        document.addEventListener("resume",function(){
            if($('#pagina_inicial').is(":visible")){
                check_if_location();
            }
        },false);
        window.addEventListener('native.keyboardhide', keyboardHideHandler);
        window.addEventListener('native.keyboardshow', keyboardShowHandler);
        $('#pagina_inicial').on('show',function(){
            if(entorno == "develop"){
                $('#redSquare').show();
            }else{
                $('#redSquare').hide();
            }
            $('.fa-search').show();
            if((typeof map === ' undefined') && (online == true)){
                location.reload();
            }           
        });
        $('#pagina_inicial').on('hide',function(){
            $('#redSquare').hide();
        });
        if(exception){ 
            online = true;
            renderPage(); 
            if($('script[src="http://maps.google.com/maps/api/js?sensor=true"]').length > 0){            
                map = new GMaps({
                    div: '#map',
                    lat: 41.3947901,
                    lng: 2.1487679,
                    zoom: 15,
                    streetViewControl: false,
                    zoomControl: false,
                    overviewMapControl: false,
                    panControl: false,
                    mapTypeControl: false,
                    tilesloaded: function() {

                    },
                    idle: function() {
                        if (transition && current_card!=4) {
                            transition = false;
                        }
                    },
                    click:function(event){
                        console.log( event.latLng.lat());
                        map.removeMarkers();
                        marker = {
                        lat: event.latLng.lat(),
                        lng: event.latLng.lng(),
                        draggable: true,           
                        };
                        setMarker();
                    }             
                });
                syncForm();
            }           
            setMarker();    
            events();
            
            window.plugins.spinnerDialog.show();
            setTimeout(function() {
                geo.getCurrentPosition(onSuccessPosition, onErrorPosition,{timeout: 10000, enableHighAccuracy: true });
            }, 2000);
            api_reconnect(true);
     }
    else
    {   
        online=false;
        renderPage(); 
        events();
        api_reconnect(false);        
    }
    $('#map').height($(window).height()-50-90);
    $('#boton_localiza').css('top',$('#map').height()-30);

    if(entorno == "develop"){
        $('#redSquare').show();
    }else{
        $('#redSquare').hide();
    }

    if(localStorage.getItem('authentication_code') != "null"){
        codes_url = "1W73SDkyRFZ8AIOWKkQOJc7A0vTzr7RTpb0Chcmsr6wY";
        $.ajax({
            url: 'https://docs.google.com/spreadsheets/u/1/d/' + codes_url + '/pub?gid=0&single=true&output=csv',
            type:'GET',
            success:function(data){
                code_info=CSV2JSON(data);
                console.log(code_info);

                console.log(localStorage.getItem(''));
                console.log(localStorage.getItem('authentication_text'));

                var checked_code = check_code(localStorage.getItem('authentication_code'));
                if(checked_code == "late" || checked_code == "wrong"){
                    localStorage.removeItem('authentication_code');
                    localStorage.removeItem('authentication_text');
                    $('#codeForm #input_code').val("");
                    console.log("Code deleted");
                }            
                console.log($('#codeForm #input_code').val());
            },
            error:function(data){
                console.log("Error al obtener valores de spreadsheet");
            }
        });        
    } 
}
function api_reconnect(value){
    if(value){
        $('#no_connect').hide();                         
    }
    else
    {      
        $('#no_connect').show();
    }

}
function check_if_GMaps(){
    //comprueba si está cargado el script remoto, si no lo está, lo cargará.
    var len = $('script[src="http://maps.google.com/maps/api/js?sensor=true"]').length;
    if (len === 0) {
        $.getScript('http://maps.google.com/maps/api/js?sensor=true');
    }   
}
function traduceDireccion(){
    var options={
        "lat":map.markers[0].position.lat(),
        "lng":map.markers[0].position.lng(),
        "callback":function(result,status){
            //console.log(result);
            //console.log(result[0].formatted_address);
            //console.log(status);
            text_location = result[0].formatted_address;

            for(var index = 0; index < result[0].address_components.length; index++){
                if(result[0].address_components[index].types[0] == "locality"){
                    address_components.town = result[0].address_components[index].long_name;
                }else if(result[0].address_components[index].types[0] == "administrative_area_level_2"){
                    address_components.province = result[0].address_components[index].long_name;
                }else if(result[0].address_components[index].types[0] == "country"){
                    address_components.country = result[0].address_components[index].long_name;
                }else if(result[0].address_components[index].types[0] == "postal_code"){
                    address_components.postalCode = result[0].address_components[index].long_name;
                }
            }
            
        }
    };

    GMaps.geocode(options);
}


function setMarker() {
    map.addMarker(marker);
    traduceDireccion();
}
function events() {

    $('#boton_localiza').on('click', function() {
        $("#boton_localiza .fa.fa-crosshairs").addClass("fa-spin");
        geo.getCurrentPosition(onSuccessPosition, onErrorPosition,{timeout: 10000, enableHighAccuracy: true });
    });
    $('#texto_basetis #azul').on('click', function(){
        var ref = cordova.InAppBrowser.open(url_basetis, '_system', 'location=yes');
        counterCode = 0;
    });

    $('#about_content #logo_arrels').on('click',function(){
        var ref2 = cordova.InAppBrowser.open(url_arrels, '_system', 'location=yes');
        counterCode = 0;
    });
    $('#gracias').on('click',function(){
        initForm();
    });
    
	$('#footer #boton').on('click',function(){

        $('#redSquare').hide();
            
        if((typeof map === 'undefined') && ($('#geocodeForm #address').val() !== ''))
            {
               //si no hay mapa pero si texto, puede continuar 
                $('#map').hide();        
                $('#footer').hide();
                $('#boton_localiza').hide();
                $('#geocodeForm').hide();
                $('.fa-search').hide();
                if($('#no_connect').is(':visible')) $('#no_connect').hide();
                transition = true;
                revealCard();
            }
        else if((typeof map === 'undefined') && ($('#geocodeForm #address').val() === '') ){
                //si no hay mapa ni texto, no puede
                window.plugins.toast.showShortCenter(lang.toast_no_conexion,function(){},function(){});
        }
        else{
            //hay mapa, asi que continua normal
            $('#map').hide();       
            $('#footer').hide();
            $('#boton_localiza').hide();
            $('#geocodeForm').hide();
            $('.fa-search').hide();
            transition = true;
            revealCard();
            traduceDireccion();
        }


	});
     $('#about #header  #share').on('click',function(){
        counterCode = 0;
        window.plugins.socialsharing.share(lang.mensaje_share,'Arrels Localizador',null,'https://play.google.com/store/apps/details?id=com.basetis.arrelsApp');
    });
    //geocodeSubmit
    $('#geocodeForm .fa-search').on('click',function(){
        $("#geocodeForm").trigger("submit");
    });
    $("#geocodeForm").submit(function(e){
        e.preventDefault();
        GMaps.geocode({
          address: $('#address').val().trim(),
          callback: function(results, status){
            if(status=='OK'){
              latlng = results[0].geometry.location;              
              map.setCenter(latlng.lat(), latlng.lng()); 
              map.removeMarkers();
              map.addMarker({
                lat: latlng.lat(),
                lng: latlng.lng(),
                draggable:true
              });             
            }
            else{
                window.plugins.toast.showShortCenter(lang.no_sitio,function(){},function(){});
            }
          }
         }); 

    $('#address').blur();
    $('#map').click();
    });
    //selector de opciones NO GPS
    $('#pop_buton_config').on('click',function(){
        cordova.plugins.diagnostic.switchToLocationSettings();
        $('#overlay-popUp').hide();
        $('#message-popUp-GPS').hide(); 
       });
    $('#pop_buton_exit').on('click',function(){
        $('#overlay-popUp').hide();        
        $('#message-popUp-GPS').hide();
    });
        
    //opciones primera vista
    $('#primera_vez .selector#firstOk').on('click',function(){
        $('#primera_vez .icono.ok').css("background-color",'#89221A');
        $('#primera_vez .icono.ok').css("color",'#fff');
        $('#primera_vez .icono.ko').css("background-color",'#E5E5E5');
        $('#primera_vez .icono.ko').css("color",'#000000');
        $('#firstKo .texto').removeClass("selected");
        $('#firstOk .texto').addClass("selected");

        setTimeout(function(){
            nextCard();
        },150);
       
    });    
    $('#primera_vez .selector#firstKo').on('click',function(){
       $('#primera_vez .icono.ko').css("background-color",'#89221A');
       $('#primera_vez .icono.ko').css("color",'#fff');
       $('#primera_vez .icono.ok').css("background-color",'#E5E5E5');
       $('#primera_vez .icono.ok').css("color",'#000000');
       $('#firstOk .texto').removeClass("selected");
       $('#firstKo .texto').addClass("selected");
       setTimeout(function(){
            nextCard();
        },150);
      
    });
 
    //opciones donde duerme
    $('#option1').on('click',function(){
       $('.casilla.selected').removeClass("selected");      
       $('#option1').addClass("selected");
       setTimeout(function(){
            nextCard();
        },150);
    });
    $('#option2').on('click',function(){
        $('.casilla.selected').removeClass("selected"); 
        $('#option2').addClass("selected");
        setTimeout(function(){
            nextCard();
        },150);
    });
    $('#option3').on('click',function(){
        $('.casilla.selected').removeClass("selected");
        $('#option3').addClass("selected"); 
        setTimeout(function(){
            nextCard();
        },150);
    });
    $('#option4').on('click',function(){
        $('.casilla.selected').removeClass("selected");
        $('#option4').addClass("selected"); 
        setTimeout(function(){
            nextCard();
        },150);
    });
    $('#option5').on('click',function(){
        $('.casilla.selected').removeClass("selected");
        $('#option5').addClass("selected"); 
        setTimeout(function(){
            nextCard();
        },150);
    });

    //seleccion animal
    $('#animales .selector#petSi').on('click',function(){
        $('#petSi .icono.ok').css("background-color",'#89221A');
        $('#petSi .icono.ok').css("color",'#fff');
        $('#petNo .icono.ko').css("background-color",'#E5E5E5');
        $('#petNo .icono.ko').css("color",'#000000');
        $('#animales .selector#petNo .texto').removeClass("selected");
        $('#animales .selector#petSi .texto').addClass("selected");
        setTimeout(function(){
            nextCard();
        },150);
    });
     $('#animales .selector#petNo').on('click',function(){
        $('#petNo .icono.ko').css("background-color",'#89221A');
        $('#petNo .icono.ko').css("color",'#fff');
        $('#petSi .icono.ok').css("background-color",'#E5E5E5');
        $('#petSi .icono.ok').css("color",'#000000');
        $('#animales .selector#petSi .texto').removeClass("selected");
        $('#animales .selector#petNo .texto').addClass("selected");
        setTimeout(function(){
            nextCard();
        },150);
    });
    $('#pop_buton').on('click',function(){
    	$('#overlay-popUp').hide();
    	$('#message-popUp').hide();
    });

    $('#next #boton').on('click',function(){        
        
        if(cards[current_card]==="personas"){
            if( ($('#hombres #elemento.slick-center').html()!=0) || ($('#mujeres #elemento.slick-center').html()!=0)   ||  ($('#indefinidos #elemento.slick-center').html()!=0)){
                elemento1 = parseInt($('#hombres #elemento.slick-center').html());
                elemento2 = parseInt($('#mujeres #elemento.slick-center').html());
                elemento3 = parseInt($('#indefinidos #elemento.slick-center').html());
                nextCard();   
            }else{
                window.plugins.toast.showShortCenter(lang.error_no_personas,function(){},function(){});
            }
        }       
        else{
            nextCard();
        }        
    });
    $('.tarjeta#about #back').on('click',function(){
        $('.tarjeta#about').hide();
        $('#popUp-code').hide();
        $('#pagina_inicial').show();
        check_if_location();
        map.refresh();
    });

    $('#icon_ayuda').on('click',function(){
        $('#pagina_inicial').hide();
        $('.tarjeta#about').show();
        counterCode = 0; 
    });
    $('#about #header #texto').on('click',function(){
        $('.tarjeta#about').hide();
        $('#popUp-code').hide();           
        $('#pagina_inicial').show();
        check_if_location();
        map.refresh();
    });


    $('#observaciones #icon_container').on('click',function(){
        window.plugins.spinnerDialog.show();
        console.log('pulsa registrar');
        answer={};
        if(typeof map !== 'undefined'){
            answer.latitude=map.markers[0].position.lat(); // float,
            answer.longitude=map.markers[0].position.lng(); // float,
            answer.address=text_location;
            answer.postalCode = address_components.postalCode;
            answer.town = address_components.town;
            answer.province = address_components.province;
            answer.country = address_components.country;        
        }
        else{
            answer.latitude = null;
            answer.longitude = null;
            answer.address = $('#geocodeForm #address').val();
            answer.postalCode = null;
            answer.town = null;
            answer.province = null;
            answer.country = null;  
        }
         // string,
        answer.maleNum=parseInt($('#hombres #elemento.slick-center').html()); // int,
        answer.femaleNum=parseInt($('#mujeres #elemento.slick-center').html()); // int,
        answer.undefinedNum=parseInt($('#indefinidos #elemento.slick-center').html()); // int,
        answer.firstTimeSeen=parseBool($('.tarjeta#primera_vez .selected').data('id')); // bool (0 o 1),
        answer.sleepingPlace=$('.tarjeta#donde_duermen .linea .selected').html(); // string,
        answer.hasPets=parseBool($('.tarjeta#animales .selected').data('id')); // bool (0 o 1),
        answer.additionalData=$('.tarjeta#observaciones #textarea').val(); // string
        answer.userKey=localStorage.getItem('authentication_text'); // string
        answer.device=device.uuid;

        $.ajax({
            type: "POST",
            url: url_destino_arrels,
            data: JSON.stringify(answer),
            contentType: "application/json",
            dataType: "json",
            timeout: 10000,
        }).done(webserviceResponseOK)
        .fail(function(error){
            webserviceResponseKO(error,answer);
        })
        .always(function() {
            window.plugins.spinnerDialog.hide();
        });
    });

    $('.icon_code').on('click',function(){
        counterCode++;
        console.log("counterCode" + counterCode);
        if(counterCode == 10){
            window.plugins.spinnerDialog.show();
            
            if(code_info[0] == undefined){
                //Afaga els codis i les dates
                codes_url = "1W73SDkyRFZ8AIOWKkQOJc7A0vTzr7RTpb0Chcmsr6wY";
                $.ajax({
                    url: 'https://docs.google.com/spreadsheets/u/1/d/' + codes_url + '/pub?gid=0&single=true&output=csv',
                    type:'GET',
                    success:function(data){
                        code_info=CSV2JSON(data);
                        console.log(code_info);
                        show_popUp_code(true);
                    },
                    error:function(data){
                        console.log("Error al obtener valores de spreadsheet");
                        show_popUp_code(false);
                    }
                });
            } else{
                show_popUp_code(true);
            }
            counterCode = 0;            
        }
    });

    $('#codeForm #input_code').on('focus', function(){
        $('.text_val_code').hide();
    });

    $('#codeForm #input_code').on('blur', function(){
        $('.text_code').hide();

        /*var code = localStorage.getItem('authentication_code');
        var checked_code = check_code(code);

        $('#codeForm #input_code').val(code);

        if(checked_code == "right"){
            $('#right_code').show();
        }else if(checked_code == "wrong"){
            $('#wrong_code').show();
        }else if(checked_code == "late"){
            $('#late_code').show();
        }else if(checked_code == "early"){
            $('#early_code').show();
        }*/
        
    });

    $('#introduce_code_but').on('click',function(){
        $('.text_val_code').hide();
        var code = $('#codeForm #input_code').val();
        var checked_code = check_code(code);
        code = code.toLowerCase();
        if(checked_code == "right"){
            $('#right_code').show();

            // Guardem el codi i el text associat
            localStorage.setItem('authentication_code', code);
            var code_text = "";
            for (var index = 0; index < code_info.length && code_text == ""; index++) {
                if(code == code_info[index].codi){
                    code_text = code_info[index].text_app;
                    console.log(code_text);
                }
            }
            localStorage.setItem('authentication_text', code_text);
        }else if(checked_code == "wrong"){
            $('#wrong_code').show();
        }else if(checked_code == "late"){
            $('#late_code').show();
        }else if(checked_code == "early"){
            $('#early_code').show();
        }        
    });

    $('#pop_code_back_but').on('click', function(){
        $('#popUp-code').hide();
        counterCode = 0;
    });

}
function show_popUp_code(success){
    window.plugins.spinnerDialog.hide();
    $('#popUp-code').show();
    if(success){
        $('#codes_fail').hide();
        $('#codes_success').show();
        $('#codeForm #input_code').val(localStorage.getItem('authentication_code'));
        $('.text_val_code').hide();
        if(localStorage.getItem('authentication_code') != '' && localStorage.getItem('authentication_code') != null){   
            var checked_code = check_code(localStorage.getItem('authentication_code'));
            if(checked_code == "right"){
                $('#right_code').show();
            }else if(checked_code == "wrong"){
                $('#wrong_code').show();
            }else if(checked_code == "late"){
                localStorage.removeItem('authentication_code');
                localStorage.removeItem('authentication_text');
                $('#codeForm #input_code').val("");
                console.log("Code deleted");
                //$('#late_code').show();
            }else if(checked_code == "early"){
                $('#early_code').show();
            }                   
        }
    }else{
        $('#codes_fail').show();
        $('#codes_success').hide();
    }    
}
function check_code(code){
    if(code != null && code != ''){
        code = code.toLowerCase();
        $('#codeForm #input_code').val(code);

        var code_is_ok = null;
        for (var index = 0; index < code_info.length && code_is_ok == null; index++) {
            if(code == code_info[index].codi){

                var data_inici = (code_info[index].data_inici != "") ? moment(getDate(code_info[index].data_inici)) : "";
                var data_final = (code_info[index].data_final != "") ? moment(getDate(code_info[index].data_final)) : "";
                var data_avui = moment(new Date());


                if ((data_inici == "") && (data_final == ""))
                {
                    code_is_ok = "wrong";
                }else{
                    if ((data_avui.isBetween(data_inici,data_final)) || ((data_avui.isSameOrAfter(data_inici) && data_final == ""))) {
                        code_is_ok = "right";
                    }else if (data_avui.isBefore(data_inici)) {
                        code_is_ok = "early";
                    }else{
                        code_is_ok = "late";
                    }
                }
            }
        }
        if(code_is_ok == null){
            code_is_ok = "wrong";
        }
    }else{
        code_is_ok = "empty";
    }
    return code_is_ok;
}
function getDate(date){
    var dateArray = date.split("/");
    // Year, Month [0, 11], Day
    var res = new Date(dateArray[2], dateArray[1] - 1, dateArray[0]);

    return res;
}

function resetForm(){
    $('.casilla.selected').removeClass("selected");
    $('#firstOk .texto').removeClass("selected");
    $('#animales .selector#petNo .texto').removeClass("selected");
    $('#animales .selector#petSi .texto').removeClass("selected");
    $('#petNo .icono.ko').css("background-color",'#E5E5E5');
    $('#petNo .icono.ko').css("color",'#000000');
    $('#petSi .icono.ok').css("background-color",'#E5E5E5');
    $('#petSi .icono.ok').css("color",'#000000');
    $('#primera_vez .icono.ok').css("background-color",'#E5E5E5');
    $('#primera_vez .icono.ok').css("color",'#000000');
    $('#primera_vez .icono.ko').css("background-color",'#E5E5E5');
    $('#primera_vez .icono.ko').css("color",'#000000');
    $('#firstKo .texto').removeClass("selected");
    $('#firstOk .texto').removeClass("selected");
    $('.materialize-textarea').val(""); 
    elemento1 = 0;
    elemento2 = 0;
    elemento3 = 0;

}
function parseBool(str) {

  if (str.length == null) {
    return str == 1 ? true : false;
  } else {
    return str == "true" ? true : false;
  }

}
function onSuccessPosition(position) {
   
    marker.lat = position.coords.latitude;
    marker.lng = position.coords.longitude;
    map.removeMarkers();
    setMarker();
    map.setCenter(position.coords.latitude, position.coords.longitude);
    $("#boton_localiza .fa.fa-crosshairs").removeClass("fa-spin");
    window.plugins.spinnerDialog.hide();
    
}


function onErrorPosition(error) {
    //alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
    $("#boton_localiza .fa.fa-crosshairs").removeClass("fa-spin");
    window.plugins.spinnerDialog.hide();
    window.plugins.toast.showShortCenter(lang.no_localization,function(){},function(){});
}
function revealCard() {
    //ocultamos todas
    $('.tarjeta').hide(); 

    console.log('card:',cards[current_card]);   
    if(cards[current_card] === "personas"){   
        $('#'+cards[current_card]+'.tarjeta #back .fa.fa-arrow-left').off();
        $('#'+cards[current_card]+'.tarjeta #back .fa.fa-arrow-left').on('click',function(){
            $("#" + cards[current_card]).hide(); 
            $('#map').show();       
            $('#footer').show();
            $('#boton_localiza').show();
            $('#donde_duermen #titulo').text('');
            $('#geocodeForm').show();
            $('.fa-search').show();
            transition = false;
            check_if_location();
            if((typeof map ==='undefined') && (online==true)){
                location.reload();
            }            
            else{
                resetForm();
            }
        });
        $('#'+cards[current_card]+'.tarjeta #texto').off();
        $('#'+cards[current_card]+'.tarjeta #texto').on('click',function(){
            $("#" + cards[current_card]).hide(); 
            $('#map').show();       
            $('#footer').show();
            $('#boton_localiza').show();
            $('#donde_duermen #titulo').text('');
            $('.fa-search').show();
            $('#geocodeForm').show();
            transition = false;
            check_if_location();
            resetForm();
        });

        $("#" + cards[current_card]).show();
        init_rollers();
        updateCounter();
        
    }
    else{
        $('#'+cards[current_card]+'.tarjeta #back .fa.fa-arrow-left').off();
        $('#'+cards[current_card]+'.tarjeta #back .fa.fa-arrow-left').on('click',function(){
          backCard();
        });
        $('#'+cards[current_card]+'.tarjeta #texto').off();
        $('#'+cards[current_card]+'.tarjeta #texto').on('click',function(){
            backCard();        
        });
        // si la seleccion de personas es 1 hombre, 1 mujer o plural/indef
        if( ($('#hombres #elemento.slick-center').html()!==0) && (($('#mujeres #elemento.slick-center').html()==0)) && (($('#indefinidos #elemento.slick-center').html()== 0)) )
        {
            $('#primera_vez #titulo').text(lang.primera_vez_hombre);            
        }
        //si solo mujer
        else if( ($('#hombres #elemento.slick-center').html()==0) && (($('#mujeres #elemento.slick-center').html()!==0)) && (($('#indefinidos #elemento.slick-center').html()== 0)) )
        {
            $('#primera_vez #titulo').text(lang.primera_vez_mujer);           
        }
        else{
            $('#primera_vez #titulo').text(lang.primera_vez_plural);           
        }

        $("#" + cards[current_card]).show();
    }
    if (cards[current_card] === "gracias"){
         $('#header').hide();
        setTimeout(function(){  
            $('#gracias').click();            
        },4000);
    }
    if (current_card < 0){
        $('.tarjeta').hide();
        $('#map').show();                
        $('#footer').show();
        $('#boton_localiza').show();
        $('.fa-search').show();
        current_card = 0;
        resetForm();
        check_if_location();
        if(entorno == "develop"){
            $('#redSquare').show();
        }else{
            $('#redSquare').hide();
        }
    }
    if(cards[current_card] === "primera_vez")
    {
        //si solo hombre
        if( ($('#hombres #elemento.slick-center').html()!=0) && (($('#mujeres #elemento.slick-center').html()==0)) && (($('#indefinidos #elemento.slick-center').html()== 0)) )
        {
            $('#donde_duermen #titulo').text(lang.donde_duerme_1hombre);
           
        }
        //si solo mujer
        else if( ($('#hombres #elemento.slick-center').html()==0) && (($('#mujeres #elemento.slick-center').html()!=0)) && (($('#indefinidos #elemento.slick-center').html()== 0)) )
        {
            $('#donde_duermen #titulo').text(lang.donde_duerme_1mujer);
           
        }
        else{
            $('#donde_duermen #titulo').text(lang.donde_duerme_multi);
           
        }
    }
    //eventos click
    
   
}
function nextCard() {
    current_card = current_card + 1;
    revealCard();
    
}
function backCard() {
    current_card = current_card - 1;
    revealCard();
    
}
function init_rollers(){
   
    $('.tarjeta#personas #contenedor').load("templates/template_opciones.html", function() {
         renderTemplate($("#template"), $(".tarjeta#personas  #contenedor"), lang);
         //HOMBRES
           slickMan = $('#hombres');
           slickWoman = $('#mujeres');
           slickIndet = $('#indefinidos');

            slickMan.slick({
                  centerMode: true,
                  slidesToShow: 3,
                  focusOnSelect: true,
                  arrows: false,
                  swipeToSlide:true,
                  edgeFriction:0,                 
                  initialSlide: elemento1

            });
             slickWoman.slick({
                 centerMode: true,
                  slidesToShow: 3,
                  focusOnSelect: true,
                  arrows: false,
                  swipeToSlide:true,
                  edgeFriction:0,                  
                  initialSlide: elemento2 
            });
              slickIndet.slick({
                 centerMode: true,
                  slidesToShow: 3,
                  focusOnSelect: true,
                  arrows: false,
                  swipeToSlide:true,
                  edgeFriction:0,                 
                  initialSlide: elemento3 
            });
              slickMan.on('afterChange',function(){
                updateCounter();
                });
            slickWoman.on('afterChange',function(){
                updateCounter();
                });
            slickIndet.on('afterChange',function(){
                updateCounter();
            });
            updateCounter();
        });  
 
}

function webserviceResponseOK(data) {
    console.log(data);
    if (data.response === "OK") { 
        resetForm();       
        nextCard();
    } else {
      window.plugins.toast.showShortBottom(lang.error_fatal,function(){},function(){});
    }

}

function webserviceResponseKO(error,answers) {
  //  alert("error WS...");
  //  window.plugins.toast.showShortBottom(lang.error_conectividad_ws,function(){},function(){});
    resetForm();
    var  data;
    var answersArray = [];
    data = localStorage.getItem('unRegistred');
    if (data)
    {
        answersArray = JSON.parse(data);
        answersArray.push(answers);
        localStorage.removeItem('unRegistred');
        localStorage.setItem('unRegistred', JSON.stringify(answersArray));
    }
    else{
        answersArray.push(answers);
        localStorage.setItem('unRegistred', JSON.stringify(answersArray));
    }
    
    nextCard();
    
}
function renderTemplate(template, container, data, append) {
    var source   = template.html();
    var template = Handlebars.compile(source);
    if (append) {
        container.append(template(data));
    } else {
        container.html(template(data)); 
    }
}

function keyboardShowHandler(e){
    console.log("Teclado abierto");
    $('.tarjeta#observaciones #next').hide();
}

function keyboardHideHandler(){
    console.log("Teclado cerrado");
    $('#address').blur();
    $('.tarjeta#observaciones #next').show();
}

function syncForm(){
    var  data = localStorage.getItem('unRegistred');
    var answersArray = [];
    if (data){
        answersArray = JSON.parse(data);
        $.each(answersArray, function(index, value) {
            $.ajax({
                type: "POST",
                url: url_destino_arrels,
                data: JSON.stringify(value),
                contentType: "application/json",
                dataType: "json",
                timeout: 10000,
            }).done(webserviceSyncResponseOK)
            .fail(function(error){
                webserviceSyncResponseKO(error,value);
            })
            .always(function() {
            });  
            delete answersArray[index];
        });
        localStorage.removeItem('unRegistred');
    }
}
function webserviceSyncResponseOK(data) {
    console.log(data);
    if (data.response === "OK") {
        console.log("Sync OK");        
    } else {
        window.plugins.toast.showShortBottom(lang.error_sync_registro,function(){},function(){});
    }
    if(typeof map === 'undefined'){
        location.reload(true);
    }
}

function webserviceSyncResponseKO(error,answers) {
    console.log("Sync KO");
    var  data;
    var answersArray = [];
    data = localStorage.getItem('unRegistred');
    if (data)
    {
        answersArray = JSON.parse(data);
        answersArray.push(answers);
        localStorage.removeItem('unRegistred');
        localStorage.setItem('unRegistred', JSON.stringify(answersArray));
    }
    else{

        answersArray.push(answers);
        localStorage.setItem('unRegistred', JSON.stringify(answersArray));
    }
    window.plugins.toast.showShortBottom(lang.error_sync_conectividad,function(){},function(){});
}
function updateCounter(){

var     numMan = parseInt($('#hombres #elemento.slick-center').html());
var     numWom=parseInt($('#mujeres #elemento.slick-center').html());
var     numIndef=parseInt($('#indefinidos #elemento.slick-center').html());
var     total =0;
total= numMan + numWom+ numIndef;
    if ((!isNaN(numMan)) && (!isNaN(numWom)) && (!isNaN(numIndef)))
    {            
        $('#personas #boton').html((total)+"&nbsp;&nbsp;&nbsp;"+lang.seleccionados);
        if(total>0){$('#personas #boton').css('background-color','#89221A');}
        else{$('#personas #boton').css('background-color','#58585B');}
    }
    else if (total == 0)
    {
        $('#personas #boton').css('background-color','#58585B');
        $('#personas #boton').html("0&nbsp;&nbsp;&nbsp;"+lang.seleccionados); 
    }
    else
    {
        $('#personas #boton').css('background-color','#58585B');
        $('#personas #boton').html("0&nbsp;&nbsp;&nbsp;"+lang.seleccionados); 
    }
}

