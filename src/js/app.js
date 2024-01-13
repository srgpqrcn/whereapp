///User login data
const loginName = localStorage.getItem('username');

///Data base initialization.
const db = {
    markers: []
};

///Map creation
const mapArea = document.getElementById("map");
const markerGroup = L.featureGroup();

const MAX_ZOOM_AUTO = 13;

let eventId;
let zoomView=false;
 
const map = L.map('map'); 

map.setView([0.0,0.0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom:1,
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//Remove all default 'click' & 'dblclick' events
map.off('click');
map.off('dblclick');

///Map functions

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
           //Convert user data position to latLng object
           //userData.position = L.latLng(userData.position);

           // if(!userData.position.equals(db.markers[i].position)){
                db.markers[i].position=userData.position;
                db.markers[i].marker.setLatLng(userData.position);
            
            //} 

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
        //userData.position=L.latLng(userData.position);
        userData.marker=L.marker(userData.position).bindPopup(userData.name); 
        //Adding user object data to database.
        db.markers.push(userData);
        //Adding marker to map layer.
        map.addLayer(userData.marker); 
        //Add marker to marker group.
        markerGroup.addLayer(userData.marker);
        
        //userData.marker.off('click');
        userData.marker.on('click',(ev)=>{   
            followMarker(ev);
            console.log("click on marker");
        });
    };

    

};

//Follow marker position
const followMarker = (markerEvent) => {
    map.setView(markerEvent.target.getLatLng(),MAX_ZOOM_AUTO);
    markerEvent.target.on('move',(ev)=>{
        map.setView(ev.target.getLatLng(),MAX_ZOOM_AUTO);
        //map.panTo(ev.target.getLatLng());
        console.log("siguiendo marker");
    })
};

//Fit map view to active markers
const fitMarkers = () => {
    //Centering markers to view
    const mapBounds = markerGroup.getBounds();
    map.fitBounds(mapBounds,{maxZoom:MAX_ZOOM_AUTO}); 
    
};

//Map Info

const mapInfo = document.getElementById("mapInfo");

const addMapInfo = () => {
    mapInfo.innerText=loginName;
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

//const serverDomain = "https://whereappapi-production.up.railway.app/"
const serverDomain = "http://127.0.0.1:3000"
const socket = io(serverDomain,{
    auth:{
        user:loginName}
});

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
    console.log("Socket Emit // Enviada nueva posicion.");
};

//Start communication & geolocation

const start = () => {

    console.log("APP INICIADA");
    addMapInfo();
    //Start communication with server 
    socketOn();
    //Call first time % define interval to get new position
    getPos();
    eventId=setInterval(getPos,INTERVAL_TIME);
    //Add event to remove 'move' events from all markers when user clicks map area
    map.on('click',()=>{
        db.markers.map((user)=>{
            user.marker.off('move');
            });
        //Change map view to see all users
        fitMarkers();
        });
    };

const stop = () => {
    clearInterval(eventId); 
    console.log("APP DETENIDA");
};


//Events

window.onload=start;
window.ondblclick=stop;



