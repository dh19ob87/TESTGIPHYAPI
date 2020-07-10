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
let inputTextForm, palabrasSugeridas;
let btnSearch, btnThemes;
let tempRandomId;
let suggestToday = new SUGGESTEDTRENDINGGIF();
let trendingGifOs = new TRENDINGGIF();
let divThemes, light, dark; // Variables para controlar el menú dinámicamente

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
  let btnMoreTrending = document.querySelector("#gifTrending button");
  btnMoreTrending.addEventListener("click", getTrendingGifs);
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
		console.log("Lo sentimos, no hemos podido establecer comunicación con la API.");
	});

	return data; // Por si acaso luego debo concatenar otra promesa.
}

/*FUNCIÓN PARA GUARDAR EL RANDOM_ID Y SEPARARME DE LA CADENA DE PROMESAS QUE TERMINA EN ALGO CASI ILEGIBLE, POR LO MENOS PARA MÍ*/

function saveTempRandomId (randomid){
	tempRandomId = randomid;
	getTrendingGifTfromTerms();
	getTrendingGifs();
}

function getTrendingGifTfromTerms(){

	let termsRandom = [];
	let randomNumbers = randomIndex(4);
	let terms = getTrendingTerms();
	let contenedor = document.getElementById("containerSuggestGifs");

	if(contenedor.childElementCount!=0){
		while(contenedor.lastElementChild){
			contenedor.removeChild(contenedor.lastElementChild);
		}
		suggestToday.gifs = [];
	}

	terms.then(function (arrayTerms){
		for(let i = 0; i < 4; i++){
			termsRandom.push(arrayTerms[randomNumbers[i]]);
		}
		searchTrendingSuggestGifos(termsRandom);
	}).catch(function (error){
		return error;
	});
}

/*FUNCIÓN PARA SELECCIONAR ALEATORIAMENTE UN TRENDING TERM*/

function randomIndex (maxLimit){
	let randomNumbers = [];
	let contador = 0;
	while(contador < maxLimit){
		let number = Math.floor(Math.random()*maxLimit);
		if(!randomNumbers.includes(number)){
			randomNumbers.push(number);
			contador ++;
		}
	}
	return randomNumbers;
}

/*FUNCIÓN PARA SOLICITAR SUGERENCIAS DE PALABRAS TRENDING*/

function getTrendingTerms (){

	let terms = fetch(trendingSearchTerms + keyAPI).then(function (response){
		return response.json();
	}).then(function (jsonTrendingTerms){
		return jsonTrendingTerms['data'];
	}).catch(function (error){
		console.log("Ups tenemos un problema. Intenta de nuevo más tarde.");
	});

	return terms;
}

/*FUNCIÓN PARA COLECCIONAR LOS TRENDING GIF SUGERIDOS*/

//1. Buscar gifs
//2. Crear objeto gif por cada entrada en el JSON
//3. Buscar los tags para cada gif, almacenarlos en su propiedad correspondiente.
//4. Guardar cada objeto gif creado en el coleccionador destinado objeto que almacene muchas opciones de sugerencias todas obtenidas desde GIPHY

function searchTrendingSuggestGifos (arrayTerms){

	arrayTerms.forEach(function (value){
		searchGifos(value);
	});
}

/*FUNCIÓN PARA TRAER GIFS DE ACUERDO A UN TAG*/
// searchGifos -> createGifObject -> getTagsFromNameGif -> addGifObjectToContainer

function searchGifos (tag){

	let gifOs = fetch(searchEndPoint + keyAPI + query + tag + limit + 20 + rating + "g" + lang + "es" + randomId + tempRandomId).then(function (response){
		return response.json();
	}).then(function (gifos){
		createGifObject(gifos);
		return gifos;
	}).catch(function (error){
		console.log("Ups tenemos un problema. Intenta de nuevo más tarde.");
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
		addGifObjectToContainer(gifObject, suggestToday);
		return jsonObject;
	}).catch(function (error){
		console.log(error);
	});
}

/*AGREGA LOS OBJETOS GIF A UN OBJETO QUE LOS COLECCIONA, BIEN SEA PARA TRENDING, PARA SUGGEST, O PARA SEARCH*/

function addGifObjectToContainer (gifObject, contenedorGifs){


	let contenedor = document.getElementById("containerSuggestGifs");
	contenedorGifs.gifs.push(gifObject);

	if(contenedorGifs.gifs.length < 5){
    let bluePrint = document.createElement("div");
    bluePrint.setAttribute("class", "bluePrintTagSugerido");
		let imgGif = document.createElement("img");
		imgGif.setAttribute("id", "TrendingGif" + contenedorGifs.gifs.length);
		imgGif.setAttribute("class", "bptsImg");
		imgGif.setAttribute("name", gifObject.idGif);
		imgGif.setAttribute("src", gifObject.urlGif);
		let label = document.createElement("label");
		label.setAttribute("id", "labelTrending" + contenedorGifs.gifs.length);
		label.setAttribute("class", "bptsLabel cabecera");
		label.setAttribute("for", gifObject.idGif);
    if(gifObject.tagsGif.length !== 0){
      label.textContent += "#" + gifObject.tagsGif[0]['name'];
    }
    else {
      label.textContent += "#" + "Nothing";
    }
		let botonx = document.createElement("button");
		botonx.setAttribute("class","bptsBtnX");
		botonx.setAttribute("id", "xTrending" + contenedorGifs.gifs.length);
		botonx.addEventListener("click", changeRandom);
		let botonVerMas = document.createElement("button");
		botonVerMas.textContent = "Ver más";
		botonVerMas.setAttribute("type", "submit");
		botonVerMas.setAttribute("form", "formTag");
		botonVerMas.setAttribute("class","bptsSeeMore");
		botonVerMas.setAttribute("id", "verMasTrending"+contenedorGifs.gifs.length);
		botonVerMas.addEventListener("click", goToTag);

    contenedor.appendChild(bluePrint);
    bluePrint.appendChild(botonx);
    bluePrint.appendChild(label);
		bluePrint.appendChild(imgGif);
    bluePrint.appendChild(botonVerMas);
	}

}

/*FUNCIÓN CHANGERANDOM() PARA CAMBIAR EL GIF EN SUGERENCIAS DE UN VIDEO. Y GOTOTAG QUE ES PARA CUANDO PRESIONEN VER MÁS, ENTONCES BUSCO UNO DE LOS TAGS EN EL LABEL DEL ELEMENTO VIDEO*/

function changeRandom (){

	let idBotonX = this.id;
	let imgGif;
	let label;
	let newIndex;

	switch(idBotonX){
		case "xTrending1":
			imgGif = document.getElementById("TrendingGif1");
			label = document.getElementById("labelTrending1");
			label.textContent = "";
			newIndex = randomIndex(suggestToday.gifs.length);
			imgGif.src = suggestToday.gifs[newIndex[0]].urlGif;
      if(suggestToday.gifs[newIndex[0]].tagsGif.length !== 0){
        label.textContent += "#" + suggestToday.gifs[newIndex[0]].tagsGif[0]['name'];
      }
      else {
        label.textContent += "#" + "Nothing";
      }
		break;

		case "xTrending2":
			imgGif = document.getElementById("TrendingGif2");
			label = document.getElementById("labelTrending2");
			label.textContent = "";
			newIndex = randomIndex(suggestToday.gifs.length);
			imgGif.src = suggestToday.gifs[newIndex[0]].urlGif;
      if(suggestToday.gifs[newIndex[0]].tagsGif.length !== 0){
        label.textContent += "#" + suggestToday.gifs[newIndex[0]].tagsGif[0]['name'];
      }
      else {
        label.textContent += "#" + "Nothing";
      }
		break;

		case "xTrending3":
			imgGif = document.getElementById("TrendingGif3");
			label = document.getElementById("labelTrending3");
			label.textContent = "";
			newIndex = randomIndex(suggestToday.gifs.length);
			imgGif.src = suggestToday.gifs[newIndex[0]].urlGif;
      if(suggestToday.gifs[newIndex[0]].tagsGif.length !== 0){
        label.textContent += "#" + suggestToday.gifs[newIndex[0]].tagsGif[0]['name'];
      }
      else {
        label.textContent += "#" + "Nothing";
      }
		break;

		case "xTrending4":
			imgGif = document.getElementById("TrendingGif4");
			label = document.getElementById("labelTrending4");
			label.textContent = "";
			newIndex = randomIndex(suggestToday.gifs.length);
			imgGif.src = suggestToday.gifs[newIndex[3]].urlGif;
      if(suggestToday.gifs[newIndex[0]].tagsGif.length !== 0){
        label.textContent += "#" + suggestToday.gifs[newIndex[0]].tagsGif[0]['name'];
      }
      else {
        label.textContent += "#" + "Nothing";
      }
		break;

		default:
			console.log("¿Alguien agregó un campo diferente?");
	}
}

/*FUNCIÓN VER MÁS DE LAS CUATRO SUGERENCIAS*/

function goToTag(){
	let inputTextForm = document.getElementById("inputTextForm");
	let idSeeMoreBtn = this.id;
	let label;

	switch(idSeeMoreBtn){

		case 'verMasTrending1':
			label = document.getElementById("labelTrending1");
			inputTextForm.value = label.textContent.split(" ")[0].split("#")[1];
		break;

		case 'verMasTrending2':
			label = document.getElementById("labelTrending2");
			inputTextForm.value = label.textContent.split(" ")[0].split("#")[1];
		break;

		case 'verMasTrending3':
			label = document.getElementById("labelTrending3");
			inputTextForm.value = label.textContent.split(" ")[0].split("#")[1];
		break;

		case 'verMasTrending4':
			label = document.getElementById("labelTrending4");
			inputTextForm.value = label.textContent.split(" ")[0].split("#")[1];
		break;
	}
}

/*FUNCIÓN PARA TRAER LOS TRENDING GIFS DESDE EL ENDPOINT CORRESPONDIENTE*/

function getTrendingGifs(){

  let trendingContainer = document.getElementById("trendingGuifos");
	let dataTrending = fetch(trendingEndPoint + keyAPI + limit + 20 + offset + trendingGifOs.offset + rating + "g" + randomId + tempRandomId).then(function(response){
		return response.json();
	}).then(function(jsonTrendingGifs){
		trendingGifOs.count = jsonTrendingGifs.pagination.count;
		trendingGifOs.totalCount = jsonTrendingGifs.pagination.total_count;
		trendingGifOs.offset += jsonTrendingGifs.pagination.count;
		return jsonTrendingGifs.data;
	}).then(function (trendingGifs){
		trendingGifs.forEach(function(value){
			let gif = new GIF(value['id'], value['images']['downsized_large']['url'], value['title']);
			termSuggestEndPoint = gif.nombreGif.split(" ")[0];
			fetch(tagsSuggestionEndPoint + termSuggestEndPoint + "}?" + keyAPI).then(function (response){
				return response.json();
			}).then(function (jsonObject){
				gif.tagsGif = jsonObject['data'];
				trendingGifOs.gifs.push(gif);
        let divTrendingGuifo = document.createElement("div");
        divTrendingGuifo.setAttribute("class", "blueprintTrendingGif");
				let img = document.createElement("img");
				img.setAttribute("id", gif.idGif);
        img.setAttribute("name", gif.nombreGif);
				img.setAttribute("class", "bpgtImg");
				img.setAttribute("src", gif.urlGif);
        img.addEventListener("click", function(){
          let goSearch = document.getElementById("inputTextForm");
          let label = document.querySelector("#" + this.id + "~ label");
          let form = document.getElementById("formTag");
          goSearch.value = label.textContent.split(" ")[0].split("#")[1];
          form.submit();
        });

				let label = document.createElement("label");
        label.setAttribute("class", "bpgtLabel cabecera");
				label.setAttribute("for", img.id);
				gif.tagsGif.forEach(function(tag){
					label.textContent += "#" + tag.name + " ";
				});

				trendingContainer.appendChild(divTrendingGuifo);
				divTrendingGuifo.appendChild(img);
        divTrendingGuifo.appendChild(label);
				return gif;
			}).catch(function (error){
				console.log(error);
			});
		});
	}).catch(function(error){
		console.log(error);
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
  divThemes.setAttribute("class", "menu");
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
	logo.src = (localStorage.getItem('selectedTheme') === "day") ? "./IMG/gifOF_logo.png" : "./IMG/gifOF_logo_dark.png";
	dropdownarrow.src = (localStorage.getItem('selectedTheme') === "day") ? "./IMG/dropdown.svg" : "./IMG/dropdown_white.svg";
}

/*Función para ocultar o mostrar el menú de temas*/

function onOffMenu (){
  if(divThemes.style.display === "" || divThemes.style.display === "flex"){
    divThemes.style.display = "none";
  }else {
    divThemes.style.display = "flex";
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
	logo.src = (localStorage.getItem('selectedTheme') === "day") ? "./IMG/gifOF_logo.png" : "./IMG/gifOF_logo_dark.png";
	dropdownarrow.src = (localStorage.getItem('selectedTheme') === "day") ? "./IMG/dropdown.svg" : "./IMG/dropdown_white.svg";
}

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
