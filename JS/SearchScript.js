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

function SUGGESTEDTRENDINGGIF(){ //Colección de gifs en suggested trending gifs
	this.gifs = [];
}

/*FUNCIÓN PARA ASEGURAR LA CARGA COMPLETA DE TODOS LOS ELEMENTOS DOM*/

window.onload = function () {
	visitas ();

	let crearGuifoLink = document.getElementsByClassName("buttonForm")[0];
	crearGuifoLink.addEventListener("click", function(){
		let linkToCreate = document.createElement("a");
		linkToCreate.setAttribute("href", "/HTML/captura_gif.html");
		document.body.appendChild(linkToCreate);
		linkToCreate.click();
	})

  secciones = document.getElementsByTagName("section");

	inputTextForm = document.getElementById("inputTextForm");
	inputTextForm.addEventListener("keyup", getAutocompleteHelp);
  btnSearch = document.getElementById("btnSearchFormSubmit");
  palabrasSugeridas = document.getElementById("palabrasSugeridas");

  let urlParameters = document.location.search;
	let URLdata = new URLSearchParams(urlParameters);
	termToSearch = URLdata.get('tagSearch');
  inputTextForm.value = termToSearch;

  let btnMoreGif = document.querySelector("#searchGifs button");
  btnMoreGif.addEventListener("click", searchAgain);
  let titleSection = document.querySelector("#searchGifs input");
  titleSection.value = termToSearch + " (Resultados)";

	btnThemes = document.getElementsByClassName("buttonForm");

  btnThemes[1].addEventListener("mouseover", hoverMouse);
  btnThemes[1].addEventListener("mouseout", hoverMouseOut);
  btnThemes[1].addEventListener("click", onOffMenu);
  btnThemes[2].addEventListener("mouseover", hoverMouse);
  btnThemes[2].addEventListener("mouseleave", hoverMouseOut);
  btnThemes[2].addEventListener("click", onOffMenu);

	function estiloSearchButton () {
		(window.screen.availWidth <= 768) ? (function (){
			if(btnSearch.childElementCount === 1){
				btnSearch.textContent = "";
				let lupa = document.createElement("img");
				lupa.src = "../IMG/lupa.svg";
				btnSearch.appendChild(lupa);
			}
		}) () : (function (){
			if(btnSearch.childElementCount <= 2){
				btnSearch.textContent = "";
				let lupa = document.createElement("img");
				lupa.src = "../IMG/lupa.svg";
				btnSearch.appendChild(lupa);
				btnSearch.appendChild(document.createTextNode(" Buscar"));
			}
		}) ();
	}

	estiloSearchButton();

	window.onresize = () => {
		estiloSearchButton();
	};

	themeMenu();
  selectedTheme();
	getRandomId();
}

/*FUNCIÓN PARA AUTOCOMPLETAR PALABRAS*/

function getAutocompleteHelp (){

  clearPalabrasSugeridas();
  if(inputTextForm.value === undefined || inputTextForm.value === null || inputTextForm.value.trim() === ""){
    btnSearch.setAttribute("disabled", "true");
    palabrasSugeridas.style.visibility = "hidden";
  }
  else{
    btnSearch.removeAttribute("disabled");
    palabrasSugeridas.style.visibility = "visible";

    let tags = fetch(autocompleteEndPoint + keyAPI + query + inputTextForm.value).then(function (response) {
  		return response.json();
  	}).then(function (jsonTags) {

      if(jsonTags['data'].length !== 0){
        jsonTags['data'].forEach(function (sugerencia){
    			let label = document.createElement("label");
    			label.style.display = "block";
    			label.textContent = sugerencia['name'];
    			label.addEventListener("click", function(){
    				inputTextForm.value = label.textContent;
            palabrasSugeridas.style.visibility = "hidden";
            clearPalabrasSugeridas();
    			});
    			palabrasSugeridas.appendChild(label);
    		});

    		return jsonTags; //Por si acaso luego necesito concatenar otra promesa.
      }else {
        clearPalabrasSugeridas();
        let label = document.createElement("label");
        label.style.display = "block";
        label.textContent = "¡Ups! No hay coincidencias para ese Tag. Anímate a ver más de nuestras sugerencias y de nuestros trending, da click en ellos para ver Guifos.";
        palabrasSugeridas.appendChild(label);
      }
  	}).catch(function (error) {
  		return error;
  	});
  }
}

/*FUNCIÓN PARA REMOVER LOS HIJOS DEL CONTENEDOR DE TAGS SUGERIDOS*/

function clearPalabrasSugeridas (){
  if(palabrasSugeridas.childElementCount !=0){
    while(palabrasSugeridas.lastElementChild){
      palabrasSugeridas.removeChild(palabrasSugeridas.lastElementChild);
    }
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
		console.log(error);
	});

	return data; // Por si acaso luego debo concatenar otra promesa.
}

/*FUNCIÓN PARA GUARDAR EL RANDOM_ID Y SEPARARME DE LA CADENA DE PROMESAS QUE TERMINA EN ALGO CASI ILEGIBLE, POR LO MENOS PARA MÍ*/

function saveTempRandomId (randomid){
	tempRandomId = randomid;
  searchGifos(termToSearch);
}

/*FUNCIÓN PARA REALIZAR LA BÚSQUEDA DE UN TAG O TÉRMINO*/

function searchGifos (tag){

	let gifOs = fetch(searchEndPoint + keyAPI + query + tag + limit + 20 + rating + "g" + lang + "es" + randomId + tempRandomId + offset + gifOnSearchSection.offset).then(function (response){
		return response.json();
	}).then(function (gifos){
    if(gifos.pagination.count !== 0){
  		gifOnSearchSection.offset += gifos.pagination.count;
  		gifOnSearchSection.totalCount = gifos.pagination.total_count;
  		gifOnSearchSection.count = gifos.pagination.count;
  		createGifObject(gifos);
  		return gifos;
    }else {
      window.alert("No hay resultados para tu búsqueda. ¡SORRY!");
      searchGifos ("Sorry");
    }
	}).catch(function (error){
		console.log(error);
	});
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

/*FUNCIÓN PARA OBTENER LOS TAGS DE CADA GIF*/

function getTagsFromNameGif(gifObject){

	termSuggestEndPoint = gifObject.nombreGif.split(" ")[0];
	let listTags = fetch(tagsSuggestionEndPoint + termSuggestEndPoint + "}?" + keyAPI).then(function (response){
		return response.json();
	}).then(function (jsonObject){
		gifObject.tagsGif = jsonObject['data'];
		console.log("Desde GetTagsFormNameGif", gifObject);
		addGifObjectToContainer(gifObject, gifOnSearchSection);
		return jsonObject;
	}).catch(function (error){
		console.log(error);
	});
}

/*FUNCIÓN PARA AGREGAR CADA GIF A LA COLECCIÓN*/

function addGifObjectToContainer (gifObject, contenedorGifs){

	let sectionSearch = document.getElementById("trendingGuifos");
  let divBtnTags = document.getElementById("tagsForSearch");
	contenedorGifs.gifs.push(gifObject);

	if(contenedorGifs.gifs.length < 5){
		let btnOptionSearch = document.createElement("button");
		btnOptionSearch.setAttribute("type","submit");
		btnOptionSearch.setAttribute("form","formTag");
		btnOptionSearch.setAttribute("id", "btnOptionTag" + contenedorGifs.gifs.length);
		btnOptionSearch.setAttribute("class", "btnTagRelated");
		btnOptionSearch.textContent = "#" + gifObject.tagsGif[0].name;
		//btnOptionSearch.addEventListener("click", newSearch);
		btnOptionSearch.addEventListener("click", function(){
			document.getElementById("inputTextForm").value = this.textContent.split("#")[1];
		});
		divBtnTags.appendChild(btnOptionSearch);
	}


	let imgGif = document.createElement("img");
	imgGif.setAttribute("id", gifObject.idGif);
	imgGif.setAttribute("src", gifObject.urlGif);
	imgGif.setAttribute("class", "bpgtImg");
	imgGif.setAttribute("name", gifObject.nombreGif);
  imgGif.addEventListener("click", function(){
    inputTextForm.value = gifObject.nombreGif.split(" ")[0];
    document.getElementById("formTag").submit();
  });

	let labelTags = document.createElement("label");
	labelTags.setAttribute("class", "bpgtLabel cabecera");
	labelTags.setAttribute("for", imgGif.name);
	gifObject.tagsGif.forEach(function (tag){
		labelTags.textContent += "#" + tag['name'] + " ";
	});

  let divBluePrint = document.createElement("div");
  divBluePrint.setAttribute("class", "blueprintTrendingGif");
  sectionSearch.appendChild(divBluePrint);
  divBluePrint.appendChild(imgGif);
	divBluePrint.appendChild(labelTags);
}

/*FUNCIÓN PARA AGREGAR MÁS GIFS*/

function searchAgain (){
	if(gifOnSearchSection.offset + gifOnSearchSection.count <= gifOnSearchSection.totalCount){
		searchGifos(termToSearch);
	}else{
		window.alert("¡Ey! Eres impresionante. Has visto todos los gif relacionados con ese tag.");
	}
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
  divThemes.setAttribute("class", "menuSearchPage");
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
	logo.src = (localStorage.getItem('selectedTheme') === "day") ? "../IMG/gifOF_logo.png" : "../IMG/gifOF_logo_dark.png";
	dropdownarrow.src = (localStorage.getItem('selectedTheme') === "day") ? "../IMG/dropdown.svg" : "../IMG/dropdown_white.svg";
}

/*FUNCIÓN PARA MOSTRAR U OCULTAR EL MENÚ DE TEMAS*/

function onOffMenu (){
  if(divThemes.style.display === "" || divThemes.style.display === "flex"){
    divThemes.style.display = "none";
		secciones[1].style.top = "200px";
  }else {
    divThemes.style.display = "flex";
		secciones[1].style.top = "100px";
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
	logo.src = (localStorage.getItem('selectedTheme') === "day") ? "../IMG/gifOF_logo.png" : "../IMG/gifOF_logo_dark.png";
	dropdownarrow.src = (localStorage.getItem('selectedTheme') === "day") ? "../IMG/dropdown.svg" : "../IMG/dropdown_white.svg";
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
