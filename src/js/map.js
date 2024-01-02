//User interaction
const userName = localStorage.getItem('username');

//Server origin
const serverOrigin = "https://whereappapi-production.up.railway.app/"
const socket = io(serverOrigin,{
    auth:{
        user:userName}
});

//Data base for client
const mapDataBase = {
    mapMarkers: []
};
let myLastPos;

//Add or update database in client side.
const updateDataBase = (userData)=>{
    
    let i;
    let oldUser=false;
        
    mapDataBase.mapMarkers.map((user,index)=>{
        if(user.name === userData.name){
            oldUser=true;
            i=index;
        }
    });
        
    if (oldUser){
        mapDataBase.mapMarkers[i].lat=userData.lat;
        mapDataBase.mapMarkers[i].long=userData.long;
        mapDataBase.mapMarkers[i].marker.setLatLng([userData.lat,userData.long]);
        console.log("usuario actualizado") ; 

    }else{
        userData.marker=L.marker([userData.lat,userData.long]).bindPopup(userData.name); 

        mapDataBase.mapMarkers.push(userData);
        console.log("usuario nuevo agregado") ; 
    }
    console.log(mapDataBase);

    drawMarkers();

}

//Socket communication. Receive data from server.
const socketOn = () => {
    console.log("Servidor - Socket establecido")
    socket.on('whereapp:serverPos',(newUserData)=>{
        updateDataBase(newUserData);
        console.log("respuesta servidor");
        
    });
}

const socketEmit = (newPos) => {
    socket.emit('whereapp:clientPos',newPos);
}

//Map creation
const mapArea = document.getElementById("map");

let eventId;
 
const map = L.map('map'); 

map.setView([0.0,0.0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom:1,
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map); 

//Map functions

const getPos = () => {
    eventId=navigator.geolocation.getCurrentPosition(newPos,errorPos,gpsOptions);
    //eventId=navigator.geolocation.watchPosition(newPos,errorPos,gpsOptions);
}

const gpsOptions = {
    enableHighAccuracy: true,
    maximumAge:10000,
    timeout:10000
}

const errorPos = (error) => {
    if (error.code === 1) {
        alert("Permitir ubicación");
    } else {
        //alert("¿Dónde estás?");
    }
}

const newPos = (pos) => {
    //almacenar posicion
    const myNewPos ={
        name:userName,
        lat:pos.coords.latitude,
        long:pos.coords.longitude
    };
    myLastPos=Object.assign({},myNewPos);

    //Socket communication. Send data to server.
    socketEmit(myNewPos);
    updateDataBase(myNewPos);
}

const drawMarkers = () => {
    const markerGroup = L.featureGroup();
    mapDataBase.mapMarkers.map((user)=>{
        if(!map.hasLayer(user.marker)){
            map.addLayer(user.marker);
            console.log("nuevo marker dibujado en mapa");
            console.log(user.marker._leaflet_id);   
        }

        //Centering markers to view
        markerGroup.addLayer(user.marker);
        const mapBounds= markerGroup.getBounds()
        map.fitBounds(mapBounds);
        //map.flyToBounds(mapBounds);
    });
        
    
}

//Start communication & geolocation

function start(){
    socketOn();
    setInterval(getPos,3000); 
    //getPos();
}

function stop(){
    
    navigator.geolocation.clearWatch(eventId); 
    //console.log("APP DETENIDA")
}

window.onload=start();


