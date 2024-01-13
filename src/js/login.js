//User interaction
const userInput = document.getElementById("userInput");
const inputName = document.getElementById("inputName");
const loginBut = document.getElementById("loginBut");

const userAction = () => {
    const name=inputName.value; 
    if(name.length>0){
        localStorage.setItem("username",name);
        userInput.setAttribute("action","./views/app.html");
    }else{
        alert("Please, introduce an user name.")
    }
};

//User interaction
loginBut.onclick=userAction;



















