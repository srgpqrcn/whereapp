/////////DB

///Data base initialization.
const db = {
    markers: []
};


/////////MAP

///Map creation
const mapArea = document.getElementById("map");
mapArea.style.display = 'none';

const markerGroup = L.featureGroup();
let mapfollowMode = false; 

const MAX_ZOOM_AUTO = 19;
const MIN_ZOOM_AUTO = 1;

let eventId;
let zoomView=false;
 
const map = L.map('map'); 

///Map functions

//Initialize map view
const initMap = () =>{
    console.log("init map")
    mapArea.style.display = 'block';

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: MAX_ZOOM_AUTO,
    minZoom:MIN_ZOOM_AUTO,
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    //Remove all default 'click' & 'dblclick' events
    map.off('click');
    map.off('dblclick');

    //Add event to remove 'move' events from all markers when user clicks map area
    map.on('click',()=>{
        db.markers.map((user)=>{
            user.marker.off('move');
            });
        //Change map view to see all users
        mapfollowMode = false;
        fitMarkers();
    });
    
};

//Update (add or update) database.
const updateMap = (userData,action) => {
    
    let i;
    let oldUser=false;
        
    db.markers.map((user,index)=>{
        if(user.name === userData.name){
            oldUser=true;
            i=index;
        }
    });
        
    if (oldUser){
        if(action==='update'){
           //Update only if position change
           //Compare new and old position
           const posEqual = userData.position.every((value, index) => value === db.markers[i].position[index]);
            if(!posEqual){
                db.markers[i].position=userData.position;
                db.markers[i].marker.setLatLng(userData.position);
            };
            
        }else{
            if(action==='remove'){
            //Remove marker from map
            map.removeLayer(db.markers[i].marker);
            markerGroup.removeLayer(db.markers[i].marker);
            db.markers.splice(i,1);
            };
        };
    }else{
        //Adding marker to user data object.
        userData.marker=L.marker(userData.position).bindPopup(userData.name); 
        //Adding user object data to database.
        db.markers.push(userData);
        //Adding marker to map layer.
        map.addLayer(userData.marker); 
        //Add marker to marker group.
        markerGroup.addLayer(userData.marker);
        
        userData.marker.on('click',(ev)=>{   
            followMarker(ev);
            console.log("click on marker");
        });

    };
    if (!mapfollowMode){ 
        fitMarkers()
    };
};

//Follow marker position
const followMarker = (markerEvent) => {
    mapfollowMode = true;
    map.setView(markerEvent.target.getLatLng(),MAX_ZOOM_AUTO);
    markerEvent.target.on('move',(ev)=>{
        //map.setView(ev.target.getLatLng(),MAX_ZOOM_AUTO);
        map.panTo(ev.target.getLatLng());
        console.log("siguiendo marker");
    })
};

//Fit map view to active markers
const fitMarkers = () => {
    //Centering markers to view
    const mapBounds = markerGroup.getBounds();
    map.fitBounds(mapBounds,{maxZoom:MAX_ZOOM_AUTO}); 
    
};


///Geolocation functions

const INTERVAL_TIME = 3000;

const getPos = () => {
    navigator.geolocation.getCurrentPosition(newPos,errorPos,gpsOptions);
};

const gpsOptions = {
    enableHighAccuracy: true
};

const errorPos = (error) => {
    if (error.code === 1) {
        alert("Please, switch GPS on or let us to use it.");

    } else {
        //alert("¿Dónde estás?");
    }
};

const newPos = (pos) => {
    //Socket communication. Send data to server.
    socketEmit({
        name:loginName,
        position:[pos.coords.latitude,pos.coords.longitude]
    });
    updateMap({
        name:loginName,
        position:[pos.coords.latitude,pos.coords.longitude]
    },'update');

    console.log("newPos//Recibida nueva posición.");
};

/////////SERVER COMMUNICATION

const serverDomain = "https://whereappserver-production.up.railway.app/";
//const serverDomain = "http://127.0.0.1:3000";
let socket;
const initSocket = (userLoginName,userSession) => {
    const socket = io(serverDomain,{
        auth:{
            user:userLoginName,
            session:userSession
        }
    });
    return socket; 
};


//Socket communication. Receive data from server.
const socketOn = () => {
    socket.on('whereapp:userOn',(userName)=>{
        console.log("USUARIO CONECTADO:",userName);
    });
    socket.on('whereapp:userOff',(userName)=>{
        console.log("USUARIO DESCONECTADO:",userName);
        const userData ={
            name:userName
        };
        updateMap(userData,'remove');
    });
    socket.on('whereapp:serverPos',(userData)=>{
        updateMap(userData,'update');
    });
};

const socketEmit = (newPos) => {
    socket.emit('whereapp:clientPos',newPos);
    //console.log("Socket Emit // Enviada nueva posicion.");
};

//Start communication & geolocation

const initApp = () => {
    console.log("initApp");
    //Start communication with server
    socket=initSocket(loginName,loginSession);
    socketOn();
    //Call first time & define interval to get new position
    getPos();
    eventId=setInterval(getPos,INTERVAL_TIME);
    initMap();
};

const stop = () => {
    clearInterval(eventId); 
    console.log("APP DETENIDA");
}

///USER LOGIN

//User login interaction
const loginArea = document.getElementById("loginContainer");
const loginInputName = document.getElementById("inputName");
const loginInputSession = document.getElementById("inputSession");
const loginBut = document.getElementById("loginBut");
let loginName;
let loginSession;

/// Testing Password
const adminSessionID = "admin12345#"

const userLogin = () => {
    let loginSucces = false;
    if(loginInputName.value.length>0 && loginInputSession.value.length>0){
        loginName = loginInputName.value;
        loginSession = loginInputSession.value;
        if (loginSession===adminSessionID){
            loginArea.style.display='none';
            initApp();
        }else{
            alert("Enter a Valid Session ID");
        }
        
       

    }else{
        alert("Please, introduce an user name and session ID.");
    }
};


//User interaction - Events
loginBut.onclick=userLogin;

