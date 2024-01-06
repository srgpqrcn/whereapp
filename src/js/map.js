//User interaction
const userName = localStorage.getItem('username');

//Server origin
const serverDomain = "https://whereappapi-production.up.railway.app/"
//const serverDomain = "http://127.0.0.1:3000"
const socket = io(serverDomain,{
    auth:{
        user:userName}
});

//Data base for client
const mapDataBase = {
    mapMarkers: []
};


//Add or update database.
const updateDataBase = (userData) => {
    
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

    }else{
        userData.marker=L.marker([userData.lat,userData.long]).bindPopup(userData.name); 
        mapDataBase.mapMarkers.push(userData);
    }
    
    //QUITAR ESTAS FUNCIONES DE AQUI, DEBERÍAN IR EN OTRA FUNCION.
    
    drawMarkers();
};

//Remove user from database & map.
const remDataBase = (userRem) => {
    mapDataBase.mapMarkers.map(user=>console.log(user.name));
    console.log(mapDataBase.mapMarkers);
    //Findindex to remove
    const i = mapDataBase.mapMarkers.map(user=>user.name).indexOf(userRem);
    //Remove marker from map
    map.removeLayer( mapDataBase.mapMarkers[i].marker);
    //Remove user from database
    mapDataBase.mapMarkers.splice(i,1);
    
    mapDataBase.mapMarkers.map(user=>console.log(user.name));
    drawMarkers();
}

//Socket communication. Receive data from server.
const socketOn = () => {
    socket.on('whereapp:userOn',(user)=>{
        console.log("USUARIO CONECTADO:",user);
    });
    socket.on('whereapp:userOff',(user)=>{
        console.log("USUARIO DESCONECTADO:",user);
        remDataBase(user);
    });
    socket.on('whereapp:serverPos',(newUserData)=>{
        updateDataBase(newUserData);
    });
};

const socketEmit = (newPos) => {
    socket.emit('whereapp:clientPos',newPos);
    console.log("Enviada nueva posicion.");
};

//Map creation
const mapArea = document.getElementById("map");

let eventId,myPos;
 
const map = L.map('map'); 

map.setView([0.0,0.0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom:1,
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map); 

//Create box container with users list
const boxControl = L.control({ position: "topright" });
const boxContainer = L.DomUtil.create("div","boxContainer");
//const boxList = document.createElement("ul");
const boxList = L.DomUtil.create("ul","boxList");
const listItem = L.DomUtil.create("li","boxListItem");
boxControl.onAdd = () => {
    listItem.appendChild(document.createTextNode(userName));
    boxList.appendChild(listItem);
    boxContainer.appendChild(boxList);
    return boxContainer;
};  
boxControl.addTo(map);

/*const updateUserInfo = (newUserName) => {
    const listItem = document.createElement('li');
    listItem.appendChild(document.createTextNode(newUserName));
    boxList.appendChild(listItem);
};*/


//Map functions

const gpsOptions = {
    enableHighAccuracy: true
};

const errorPos = (error) => {
    if (error.code === 1) {
        prompt("Permitir ubicación.");

    } else {
        //alert("¿Dónde estás?");
    }
};

const newPos = (pos) => {
    //almacenar posicion
    myPos ={
        name:userName,
        lat:pos.coords.latitude,
        long:pos.coords.longitude
    };

    //Socket communication. Send data to server.
    socketEmit(myPos);
    updateDataBase(myPos);
    //console.log("Recibida nueva posición.");
};

const drawMarkers = () => {
    const markerGroup = L.featureGroup();
    mapDataBase.mapMarkers.map((user)=>{
        if(!map.hasLayer(user.marker)){
            map.addLayer(user.marker); 
        }

        //Creating markers group
        markerGroup.addLayer(user.marker);
    });
    
    //Centering markers to view
    const mapBounds = markerGroup.getBounds();
    map.fitBounds(mapBounds,{padding:[50,50]});

    //Showing users connected inside text box
    //showUsers();
};

const getPos = () => {
    navigator.geolocation.getCurrentPosition(newPos,errorPos,gpsOptions);
};

//Start communication & geolocation

const start = () => {
    console.log("APP INICIADA");
    //Start communication with server 
    socketOn();
    //Defined interval to get new position
    eventId=setInterval(getPos,3000);
};

const stop = () => {
    clearInterval(eventId); 
    console.log("APP DETENIDA");
};

window.onload=start;
window.ondblclick=stop;



