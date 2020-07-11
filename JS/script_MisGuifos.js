/*DECLARACIÓN DE CAMPOS NECESARIOS PARA USAR LOS ENDPOINT*/

const keyAPI = "api_key=Cs2BQgpjzHzBhJD62KldclezlrxEXWDW";
const query = "&q="; //Término que deseamos buscar
const limit = "&limit="; //Límite de items a retornar en la solicitud.
const offset = "&offset="; //Es el desplazamiento de resultados, si hay un total de 1000, un offset de 100, retorna un total indicado en limit desde 1001.
const rating = "&rating="; //g, PG, PG-13, R
const lang = "&lang="; // Es el lenguaje
const randomId = "&random_id=";
const ids = "&ids=";
const term = "&term="
const sourceImageUrl = "&source_image_url=";
const file = "&file=";
let termSuggestEndPoint = "";
let gifIdEndPoint = "";

/*DECLARACIÓN DIRECCIONES ENDPOINT*/

const searchEndPoint = "https://api.giphy.com/v1/gifs/search?"; // + keyAPI + query + limit + offset + rating + lang + random_id
const trendingEndPoint = "https://api.giphy.com/v1/gifs/trending?"; // + keyAPI + limit + offset + rating + random_id
const randomIdEndPoint = "https://api.giphy.com/v1/randomid?" // + keyAPI
const gifByIdEndPoint = "https://api.giphy.com/v1/gifs/{" + gifIdEndPoint + "}?"; // + keyAPI + gif_id + random_id
const gifsByIdsEndPoint = "https://api.giphy.com/v1/gifs?"; // + keyAPI + ids (Es un String, lista de palabras separadas por comas) + random_id
const uploadEndPoint = "https://upload.giphy.com/v1/gifs?"; // + keyAPI + file | source_image_url + tags + source_post_url
const autocompleteEndPoint = "https://api.giphy.com/v1/gifs/search/tags?"; // + keyAPI + query.
const tagsSuggestionEndPoint = "https://api.giphy.com/v1/tags/related/"+ "{"; // + termSuggestEndPoint + "}?"; // keyAPI -> need termSuggestEndPoint
const trendingSearchTerms = "https://api.giphy.com/v1/trending/searches?"; // + keyAPI
const datamuse = "http://api.datamuse.com/words?ml="; // Sirve para hacer test de autocompletado

/*ELEMENTOS DOM EN EL GLOBAL SCOPE*/

let secciones; // 0 Formulario | 1 Recomendados | 2 Trending
let inputTextForm, palabrasSugeridas, termToSearch;
let btnSearch, btnThemes;
let tempRandomId;
let divThemes, light, dark; // Variables para controlar el menú dinámicamente
let suggestToday = new SUGGESTEDTRENDINGGIF();
let gifOnSearchSection = new SEARCHEDGIF();
let trendingGifOs = new TRENDINGGIF();
let mgCollect = new MYGIFOSCOLLECTION();

/*CONSTRUCTORES DE OBJETOS GIF*/

function GIF (id, url, nombre){ //Representa a un gif.
	this.idGif = id;
	this.urlGif = url;
	this.nombreGif = nombre;
	this.tagsGif = [];
}

function TRENDINGGIF (gif, offset = 0, totalCount = 0, count = 0){ //Representa toda la colección de Gif en Trending.
	this.gifs = [];
	this.offset = offset;
	this.totalCount = totalCount;
	this.count = count;
}

function SEARCHEDGIF (gif, offset = 0, totalCount = 0, count = 0){ //Representa toda la colección de Gif en Trending.
	this.gifs = [];
	this.offset = offset; // Su valor se actualiza con cada request al sumarle el valor de count, así sabemos desde donde pedir más gifs
	this.totalCount = totalCount;
	this.count = count;
}

function MYGIFOSCOLLECTION(){ //Colección de gifs en suggested trending gifs
	this.gifs = [];
}

function SUGGESTEDTRENDINGGIF(){ //Colección de gifs en suggested trending gifs
	this.gifs = [];
}

/*FUNCIÓN PARA ASEGURAR LA CARGA COMPLETA DE TODOS LOS ELEMENTOS DOM*/

window.onload = function () {

  visitas();

	let crearGuifoLink = document.getElementsByClassName("buttonForm")[0];
	crearGuifoLink.addEventListener("click", function(){
		let linkToCreate = document.createElement("a");
		linkToCreate.setAttribute("href", "https://dh19ob87.github.io/TESTGIPHYAPI/HTML/captura_gif.html");
		document.body.appendChild(linkToCreate);
		linkToCreate.click();
	})

  let link = document.querySelector("#formulario>a");
  link.style.color = "rgba(145, 130, 162, 1)";

  secciones = document.getElementsByTagName("section");

	btnThemes = document.getElementsByClassName("buttonForm");

  btnThemes[1].addEventListener("mouseover", hoverMouse);
  btnThemes[1].addEventListener("mouseout", hoverMouseOut);
  btnThemes[1].addEventListener("click", onOffMenu);
  btnThemes[2].addEventListener("mouseover", hoverMouse);
  btnThemes[2].addEventListener("mouseleave", hoverMouseOut);
  btnThemes[2].addEventListener("click", onOffMenu);

	themeMenu();
  selectedTheme();
	getRandomId();
}

//Todos los ids de los gifos serán separados por un # de modo que retornaremos un campo en localStorage llamado "misGifOS"
//0. Tomar los ids de localStorage
//1. Solicitar Random_Id;
//2. Realizar request al EndPoint searchGifsByIds.
//3. Retornar la promesa o llamar a una función que crea los objetos Gifs.
//4. Enviar cada Gif a una función que retorna sus tags.
//5. Invocar la función que retorna los tags EndPoint agregarlos al objeto gif retornar la promesa.
//6. Con cada promesa agregar el gif al coleccionador y publicar el gif añadido a la colección.

/*FUNCIÓN PARA ESCRIBIR UN ID EN EL LOCALSTORAGE*/

function writeOnLocalStorage(idGif){
  if(window.localStorage.getItem("misGuifOs") === null){
    window.localStorage.setItem("misGuifOs", "#idGif");
  }else {
    window.localStorage.setItem("misGuifOs", window.localStorage.getItem("misGuifOs") + "#" + idGif);
  }
}

/*FUNCIÓN PARA LEER LOS IDS EN EL LOCALSTORAGE ITEM "misGifOs"*/
function searchOnLocalStorage(){
	let myGifOs;
  if(localStorage.getItem("misGuifOs") !== null){
    let storageData = localStorage.getItem("misGuifOs").split("#");
  	storageData.shift();
  	myGifOs = storageData.join();
  	return myGifOs;
  }
}

/*FUNCIÓN PARA OBTENER UN RANDOM_ID*/

function getRandomId (){
	let data = fetch(randomIdEndPoint + keyAPI).then(function(response){
		return response.json();
	}).then(function (jsonId){
		saveTempRandomId(jsonId['data']['random_id']);
		return jsonId['data']['random_id'];
	}).catch(function (error){
	});

	return data; // Por si acaso luego debo concatenar otra promesa.
}

/*FUNCIÓN PARA GUARDAR EL RANDOM_ID Y SEPARARME DE LA CADENA DE PROMESAS QUE TERMINA EN ALGO CASI ILEGIBLE, POR LO MENOS PARA MÍ*/

function saveTempRandomId (randomid){
	tempRandomId = randomid;
  let stringGifOs = searchOnLocalStorage();
  if(stringGifOs === undefined){
    window.alert("¡Wow! Esto se ve muy solo. ¿Qué tal si creas primero un GIF? Da click en Crear un GIF y muestra al mundo lo creativo que eres.");
  }
  else {
    searchMyGifOs(stringGifOs);
  }
}

/*FUNCIÓN BUSCAR MIS GIFOS MEDIANTE EL ENDPOINT GETGIFSBYIDENDPOINT*/

function searchMyGifOs (listIdGifs){

	if(listIdGifs === null){
		window.alert("¡Wow! Esto se ve muy solo. ¿Qué tal si creas primero un GIF? Da click en Crear GuifOs y muestra al mundo lo creativo que eres.")
	}
	else{
		let misGifs = fetch(gifsByIdsEndPoint+keyAPI + ids + listIdGifs + randomId + tempRandomId).then( function (dataGifos){
			return dataGifos.json();
		}).then(function (jsonGifos){
			jsonGifos.data.forEach(function (item){
				let gif = new GIF(item['id'], item['images']['downsized_large']['url'], ((item['title'] === "") ? item['slug'].split("-")[0] : item['title']));
				// let gif = new GIF(item['id'], item['images']['downsized_large']['url'], item['title']);
				getTagsFromNameGif(gif, 7); //Voy a enviarlo al coleccionador y este lo envía al publicador.
			});
		}).catch(function (error){
			console.log(error);
		});
	}
}

/*FUNCIÓN PARA OBTENER LOS TAGS DE CADA GIF*/

function getTagsFromNameGif(gifObject, endPointId){
	termSuggestEndPoint = gifObject.nombreGif.split(" ")[0];
	let listTags = fetch(tagsSuggestionEndPoint + termSuggestEndPoint + "}?" + keyAPI).then(function (response){
		return response.json();
	}).then(function (jsonTags){
		gifObject.tagsGif = jsonTags['data'];
		addGifObjectToContainer(gifObject, endPointId);
		return jsonTags;
	}).catch(function (error){
		console.log(error);
	});
}

/*FUNCIÓN PARA AGREGAR CADA GIF A LA COLECCIÓN*/

function addGifObjectToContainer (gifObject, endPointId){ //EN LUGAR DE RECIBIR EL CONTENEDOR QUE ESTÁ EN EL SCOPE GLOBAL RECIBIR EL FLAG

	let elementContainer, divbp, imgGif, labelTags;

	if(endPointId === 7){
		mgCollect.gifs.push(gifObject);
		elementContainer = document.getElementById("trendingGuifos");
    divbp = document.createElement("div");
    divbp.setAttribute("class", "blueprintTrendingGif");
		imgGif = document.createElement("img");
		imgGif.setAttribute("id", gifObject.idGif);
		imgGif.setAttribute("src", gifObject.urlGif);
		imgGif.setAttribute("class", "bpgtImg");
    imgGif.setAttribute("name", gifObject.nombreGif);
		labelTags = document.createElement("label");
		labelTags.setAttribute("class", "bpgtLabel cabecera");
		gifObject.tagsGif.forEach(function (tag){
			labelTags.textContent += "#" + tag['name'] + " ";
		});
		elementContainer.appendChild(divbp);
    divbp.appendChild(imgGif);
		divbp.appendChild(labelTags);
	}
}

/*FUNCION PARA CREAR OBJETOS TIPO GIF DEL ARRAY JSON RETORNADO POR searchGifos*/
// El index para el id: ['data']['id']
// El index para el url: ['data']['images']['fixed_width']['mp4'] || El index para el url: ['data']['images']['downsized_large']['url']
// El index para el título: ['data']['title']

function createGifObject (jsonObject){
	jsonObject['data'].forEach(function(value){
		let gif = new GIF(value['id'], value['images']['downsized_large']['url'], value['title']);
		getTagsFromNameGif(gif);
	});
}

/*FUNCIÓN PARA VALIDAR EFECTO HOVER EN BOTONES SIMULTÁNEOS*/

function hoverMouse (){
    btnThemes[1].style.outlineWidth = "1px";
    btnThemes[1].style.outlineColor = "black";
    btnThemes[1].style.outlineStyle = "dotted";
    btnThemes[1].style.outlineOffset = "-5px";
    btnThemes[1].style.backgroundColor = (localStorage.getItem('selectedTheme') === "day") ? "rgba(230, 187, 226, 1)" : "rgba(206, 54, 219, 1)";
    btnThemes[2].style.outlineWidth = "1px";
    btnThemes[2].style.outlineColor = "black";
    btnThemes[2].style.outlineStyle = "dotted";
    btnThemes[2].style.outlineOffset = "-5px";
    btnThemes[2].style.backgroundColor = (localStorage.getItem('selectedTheme') === "day") ? "rgba(230, 187, 226, 1)" : "rgba(206, 54, 219, 1)";
}

/*FUNCIÓN PARA VALIDAR EL EVENTO DE QUITAR EL MOUSE EN BOTONES SIMULTÁNEOS*/

function hoverMouseOut (){
  btnThemes[1].style.outline = "none";
  btnThemes[1].style.backgroundColor = (localStorage.getItem('selectedTheme') === "day") ? "rgba(247, 201, 243, 1)" : "rgba(238, 62, 254, 1)";
  btnThemes[2].style.outline = "none";
  btnThemes[2].style.backgroundColor = (localStorage.getItem('selectedTheme') === "day") ? "rgba(247, 201, 243, 1)" : "rgba(238, 62, 254, 1)";
}

/*FUNCIÓN PARA CREAR EL MENÚ PARA SELECCIONAR TEMAS*/

function themeMenu (){

  divThemes = document.createElement("div");
  divThemes.setAttribute("class", "menuMyGuifoPage");
  divThemes.style.display = "none";
  light = document.createElement("label");
  light.setAttribute("class", "optionTheme");
  light.setAttribute("name", "day");
  light.textContent = "Sailor Day";
  light.addEventListener("click", function(){
    changeTheme("day");
  });
  dark = document.createElement("dark");
  dark.setAttribute("class", "optionTheme");
  dark.setAttribute("name", "dark");
  dark.textContent = "Sailor Night";
  dark.addEventListener("click", function(){
    changeTheme("nigth");
  });
  container = document.getElementById("formulario");
  container.appendChild(divThemes);
  divThemes.appendChild(light);
  divThemes.appendChild(dark);
}

/*FUNCIÓN PARA HABILITAR UN SOLO TEMA*/

function selectedTheme (){
  let themeSelected = localStorage.getItem('selectedTheme');
	let logo = document.querySelector("#formulario figure a img");
	let dropdownarrow = document.querySelector("#formulario button:nth-of-type(3) img");

  if(themeSelected === null){
    for(let i = 0; i < document.styleSheets.length; i ++){
      if(i !== 0){
        document.styleSheets[i].disabled = true;
      }
    }
		localStorage.setItem('selectedTheme', 'day');
    light.setAttribute("class", "actualTheme");
    dark.setAttribute("class", "optionTheme");
  }else{
    if(themeSelected === "day"){
      document.styleSheets[0].disabled = false;
      document.styleSheets[1].disabled = true;
      light.setAttribute("class", "actualTheme");
      dark.setAttribute("class", "optionTheme");
    }else{
      document.styleSheets[0].disabled = true;
      document.styleSheets[1].disabled = false;
      light.setAttribute("class", "optionTheme");
      dark.setAttribute("class", "actualTheme");
    }
  }
	btnThemes[1].style.backgroundColor = (localStorage.getItem('selectedTheme') === "day") ? "rgba(247, 201, 243, 1)" : "rgba(238, 62, 254, 1)";
	btnThemes[2].style.backgroundColor = (localStorage.getItem('selectedTheme') === "day") ? "rgba(247, 201, 243, 1)" : "rgba(238, 62, 254, 1)";
	logo.src = (localStorage.getItem('selectedTheme') === "day") ? "https://dh19ob87.github.io/TESTGIPHYAPI/IMG/gifOF_logo.png" : "https://dh19ob87.github.io/TESTGIPHYAPI/IMG/gifOF_logo_dark.png";
	dropdownarrow.src = (localStorage.getItem('selectedTheme') === "day") ? "https://dh19ob87.github.io/TESTGIPHYAPI/IMG/dropdown.svg" : "https://dh19ob87.github.io/TESTGIPHYAPI/IMG/dropdown_white.svg";
}

/*FUNCIÓN PARA MOSTRAR U OCULTAR EL MENÚ DE TEMAS*/

function onOffMenu (){
  if(divThemes.style.display === "" || divThemes.style.display === "flex"){
    divThemes.style.display = "none";
		// secciones[1].style.top = "2000px";
  }else {
    divThemes.style.display = "flex";
		// secciones[1].style.top = "10000px";
  }
}

/*FUNCIÓN PARA ELEGIR TEMA*/

function changeTheme (label){
	let logo = document.querySelector("#formulario figure a img");
	let dropdownarrow = document.querySelector("#formulario button:nth-of-type(3) img");

  if(label === "day"){
    document.styleSheets[0].disabled = false;
    document.styleSheets[1].disabled = true;
    light.setAttribute("class", "actualTheme");
    dark.setAttribute("class", "optionTheme");
		localStorage.setItem('selectedTheme', 'day');
		onOffMenu ();
  }else{
    document.styleSheets[0].disabled = true;
    document.styleSheets[1].disabled = false;
    light.setAttribute("class", "optionTheme");
    dark.setAttribute("class", "actualTheme");
		localStorage.setItem('selectedTheme', 'dark');
		onOffMenu ();
  }
	btnThemes[1].style.backgroundColor = (localStorage.getItem('selectedTheme') === "day") ? "rgba(247, 201, 243, 1)" : "rgba(238, 62, 254, 1)";
	btnThemes[2].style.backgroundColor = (localStorage.getItem('selectedTheme') === "day") ? "rgba(247, 201, 243, 1)" : "rgba(238, 62, 254, 1)";
	logo.src = (localStorage.getItem('selectedTheme') === "day") ? "https://dh19ob87.github.io/TESTGIPHYAPI/IMG/gifOF_logo.png" : "https://dh19ob87.github.io/TESTGIPHYAPI/IMG/gifOF_logo_dark.png";
	dropdownarrow.src = (localStorage.getItem('selectedTheme') === "day") ? "https://dh19ob87.github.io/TESTGIPHYAPI/IMG/dropdown.svg" : "https://dh19ob87.github.io/TESTGIPHYAPI/IMG/dropdown_white.svg";
}

/*CONTADOR DE VISITAS*/

function visitas (){
  let contador = document.getElementById("contadorVisitas");
  if(window.localStorage.getItem("NumVisitas") === null){
    window.localStorage.setItem("NumVisitas", 1);
    contador.textContent = "¡Bienvenidos a Guifos.com! ------ Donde los gifs están ////// Número de visitas: " + window.localStorage.getItem("NumVisitas");
  }else {
    window.localStorage.setItem("NumVisitas", Number(window.localStorage.getItem("NumVisitas"))+1);
    contador.textContent = "¡Bienvenidos a Guifos.com! ------ Donde los gifs están ////// Número de visitas: " + window.localStorage.getItem("NumVisitas");
  }
}
