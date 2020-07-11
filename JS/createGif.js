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
const tagList = "&tags="
const sourcePostUrl = "&source_post_url="
let termSuggestEndPoint = "";
let gifIdEndPoint = "";

/*DECLARACIÓN DIRECCIONES ENDPOINT*/

const searchEndPoint = "https://api.giphy.com/v1/gifs/search?"; // + keyAPI + query + limit + offset + rating + lang + random_id
const trendingEndPoint = "https://api.giphy.com/v1/gifs/trending?"; // + keyAPI + limit + offset + rating + random_id
const randomIdEndPoint = "https://api.giphy.com/v1/randomid?" // + keyAPI
const gifByIdEndPoint = "https://api.giphy.com/v1/gifs/{" + gifIdEndPoint + "}?"; // + keyAPI + gif_id + random_id
const gifsByIdsEndPoint = "https://api.giphy.com/v1/gifs?"; // + keyAPI + ids (Es un String, lista de palabras separadas por comas) + random_id
const uploadEndPoint = "https://upload.giphy.com/v1/gifs?"; //https://upload.giphy.com/v1/gifs? + keyAPI + file | source_image_url + tags + source_post_url
const autocompleteEndPoint = "https://api.giphy.com/v1/gifs/search/tags?"; // + keyAPI + query.
const tagsSuggestionEndPoint = "https://api.giphy.com/v1/tags/related/"+ "{"; // + termSuggestEndPoint + "}?"; // keyAPI -> need termSuggestEndPoint
const trendingSearchTerms = "https://api.giphy.com/v1/trending/searches?"; // + keyAPI
const datamuse = "http://api.datamuse.com/words?ml="; // Sirve para hacer test de autocompletado

/*ELEMENTOS DOM EN EL GLOBAL SCOPE*/

let secciones; // 0 Formulario | 1 Recomendados | 2 Trending
let ventanas, panels, outNow;
let inputTextForm, palabrasSugeridas, termToSearch;
let btnSearch, btnThemes, btnsWindow;
let tempRandomId;
let divThemes, light, dark; // Variables para controlar el menú dinámicamente
let suggestToday = new SUGGESTEDTRENDINGGIF();
let gifOnSearchSection = new SEARCHEDGIF();
let trendingGifOs = new TRENDINGGIF();
let mgCollect = new MYGIFOSCOLLECTION();

/*VARIABLES PARA CONTROLAR TODO EL PROCESO DE CREACIÓN DEL GIF*/

let isStop = true, isPosterImg = true, elapsedTime;
let videoElement;
let mediaStream, camStream, cloneCamStream, linkDownload;
let recorderRTC, multimediaRecorder, piezas = [];
let duracionGif, duracionMP4, startRec, endRec;
let URLGif, blobGIF, poster, contextoPoster, posterUrl, gif, xhr;
let URLMP4;

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
  secciones = document.getElementsByTagName("section"); // Todas las secciones en la página.
  secciones[1].style.top = "300px";

	ventanas = document.getElementsByClassName("windowInfo"); // Todas las ventanas en la página.
	panels = document.getElementsByClassName("panel");

	videoElement = ventanas[1].children[2];
  btnsWindow = document.getElementsByClassName("btnWindow");
  btnsWindow[0].addEventListener("click", function(){
    let linkTemp = document.createElement("a");
    linkTemp.setAttribute("href","https://dh19ob87.github.io/TESTGIPHYAPI/index.html");
    document.body.appendChild(linkTemp);
    linkTemp.click();
  });
  btnsWindow[1].addEventListener("click", recTest);
	btnsWindow[2].addEventListener("click", recordingGif);
	btnsWindow[3].addEventListener("click", recordingGif);
	btnsWindow[4].addEventListener("click", previewGif);
	btnsWindow[5].addEventListener("click", previewGif);
	btnsWindow[6].addEventListener("click", reproducirGif);
	btnsWindow[7].addEventListener("click", repetirCaptura);
	btnsWindow[8].addEventListener("click", subirGuifo);
	btnsWindow[9].addEventListener("click", cancelarSubida);
	btnsWindow[10].addEventListener("click", copiarEnlaceGuifo);
	btnsWindow[11].addEventListener("click", descargarGuifo);
	btnsWindow[12].addEventListener("click", allIsDone);

	outNow = document.getElementsByClassName("bptsBtnXRec");
	for(let x of outNow){
		x.addEventListener("click", allIsDone);
	}

  visitas();
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
		console.log(error);
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
				getTagsFromNameGif(gif, 7);
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
		if(gifObject.tagsGif.length != 0){
			gifObject.tagsGif.forEach(function (tag){
				labelTags.textContent += "#" + tag['name'] + " ";
			});
		}else{
			labelTags.textContent += "#NoTagsFound";
		}
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
	console.log("Soy createGifObject");
	jsonObject['data'].forEach(function(value){
		let gif = new GIF(value['id'], value['images']['downsized_large']['url'], value['title']);
		getTagsFromNameGif(gif);
	});
}

/*FUNCIÓN PARA HABILITAR UN SOLO TEMA*/

function selectedTheme (){
  let themeSelected = localStorage.getItem('selectedTheme');
  if(themeSelected === null){
    for(let i = 0; i < document.styleSheets.length; i ++){
      if(i !== 0){
        document.styleSheets[i].disabled = true;
      }
    }
		localStorage.setItem('selectedTheme', 'day');
  }else{
    if(themeSelected === "day"){
      document.styleSheets[0].disabled = false;
      document.styleSheets[1].disabled = true;
    }else{
      document.styleSheets[0].disabled = true;
      document.styleSheets[1].disabled = false;
    }
  }
	logo.src = (localStorage.getItem('selectedTheme') === "day") ? "https://dh19ob87.github.io/TESTGIPHYAPI/IMG/gifOF_logo.png" : "https://dh19ob87.github.io/TESTGIPHYAPI/IMG/gifOF_logo_dark.png";
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

/*FUNCIÓN PARA ETAPA UNO DE LA GRABACIÓN DE UN GIF*/

function recTest(){
	ventanas[0].style.display = "none";
	secciones[1].style.display = "none";
	ventanas[1].style.display = "block";
	videoElement.style.display = "block";
	if(isStop){
		mediaStream = navigator.mediaDevices.getUserMedia(
			{
				audio: false,
				video:
				{
					height:
					{
						max: 460
					},
					width: 1080
				}
			}
		).then(function (stream) {
			camStream = stream;
			videoElement.srcObject = stream;
			videoElement.play();
			isStop = false;
			cloneCamStream = stream.clone();
			multimediaRecorder = new MediaRecorder(cloneCamStream);
		}).catch(function (error){
			throw new Error("No ha sido posible cargar la cámara, por favor inténtelo de nuevo. Por ahora regresaremos a la página principal");
			window.alert("Está bien, tal vez en otra ocasión quieras darnos permisos para usar tu cámara.");
		});
	}
}

/*FUNCIÓN PARA EL INICIO DE LA GRABACIÓN*/

function recordingGif(){
	panels[0].style.display = "none";
	panels[1].style.display = "block";
	panels[1].children[1].children[0].src = "https://dh19ob87.github.io/TESTGIPHYAPI/IMG/recording_dark.svg";
	panels[1].children[1].children[0].style.width = "18px";
	panels[1].children[1].children[0].style.height = "18px";
	recorderRTC = new RecordRTC(camStream, {
		type: "gif",
		recorderType: GifRecorder,
		checkForInnactiveTracks: true,
		frameRate: 1,
		quality: 360,
		height: 400,
		onGifRecordingStarted: () => console.log("Grabación iniciada");
	});
	recorderRTC.startRecording();
	startRec = performance.now();
	multimediaRecorder.start();
	multimediaRecorder.ondataavailable = function (piece){
		piezas.push(piece.data);
	};
	cronometro();
}

/*FUNCIÓN PARA VER EL PREVIEW DEL GIF*/

function previewGif(){

	for(let parte of panels[2].children[4].children){
			parte.setAttribute("class", "unloadFragment");
	}
	window.clearInterval(elapsedTime);
	panels[1].style.display = "none";
	panels[2].style.display = "block";
	offCamara();

	multimediaRecorder.onstop = function (e) {
		let blobMP4 = new Blob(piezas, {"type": "video/mp4;codecs=avc1.42E01E.mp4a.40.2"});
		piezas = [];
		URLMP4 = URL.createObjectURL(blobMP4);
		videoElement.src = URLMP4;
		videoElement.play();
		linkDownload = document.createElement("a");
    linkDownload.style.display = "none";
    linkDownload.href = URLMP4;
    linkDownload.download = "TuGuifo.mp4";
    document.body.appendChild(linkDownload);
    linkDownload.click();
    setTimeout(function (){
    	document.body.removeChild(linkDownload);
    }, 100);
	};

	videoElement.ondurationchange = function (){
		duracionMP4 = this.duration;
		btnsWindow[6].style.visibility = "visible";
	};

	recorderRTC.stopRecording(function (){
		blobGIF = recorderRTC.getBlob();
		URLGif = URL.createObjectURL(blobGIF);
		endRec = performance.now();
		duracionGif = Math.floor((endRec - startRec)/1000) - 1;
		gif = document.createElement("img");
		videoElement.style.display = "none";
		gif.src = URLGif;
		gif.style.position = "relative";
		gif.style.top = "0px";
		gif.style.right = "0px";
		gif.style.bottom = "0px";
		gif.style.left = "0.5%";
		gif.onload = function (){
			ventanas[1].insertBefore(gif, ventanas[1].children[3]);
			gif.style.display = "none";
			gif.setAttribute("class", "imgPreviewGif");
			poster = document.createElement("canvas");
			poster.setAttribute("id", "Micanvas");
			poster.setAttribute("class", "imgPreviewGif");
			poster.style.position = "relative";
			poster.style.top = "0px";
			poster.style.right = "0px";
			poster.style.bottom = "0px";
			poster.style.left = "0.5%";
			poster.width = gif.width;
			poster.height = gif.height;
			ventanas[1].insertBefore(poster, ventanas[1].children[3]);
			contextoPoster = poster.getContext("2d");
			contextoPoster.drawImage(gif, 0, 0, gif.width, gif.height);
		};
	});
}

/*FUNCIÓN PARA REPRODUCIR GIF*/

function reproducirGif(){
	//Insertar código
	let canva = document.createElement("canva");
	ventanas[1].appendChild(canva);
	videoElement.style.display = "none";
	poster.style.display = "none";
	gif.style.display = "block";
	cronometro(duracionGif, true);
}

/*FUNCIÓN PARA REPETIR CAPTURA*/

function repetirCaptura(){
	stopStreams();
	panels[2].children[0].value = "00:00:00:00";
	panels[2].style.display = "none";
	panels[0].style.display = "block";
	videoElement.src = " ";
	ventanas[1].removeChild(gif);
	ventanas[1].removeChild(poster);
	recTest();
}

/*FUNCIÓN PARA DETENER LOS STREAMINGS*/

function stopStreams(){
	offCamara();
}

/*FUNCIÓN SUBIR GUIFO*/

function subirGuifo(){
	ventanas[1].style.display = "none";
	ventanas[2].style.display = "block";
	let tagsGif = prompt("Agrega algunos tags para tu GuifO", "#undefined, #ramdom, #lucky, #test, #trying");
	let iniTime = 0, elapsedTime = 0, estimatedTime = 0, velocidad = 0, partes = 0, loadedParts = 0;
	if(!tagsGif.includes(",")){
		tagsGif = tagsGif.split(" ").join();
	}
	let formData = new FormData();
	formData.append("api_key", "Cs2BQgpjzHzBhJD62KldclezlrxEXWDW");
	formData.append("file", blobGIF, "miGuifO.gif");
	formData.append("tags", tagsGif);
	formData.append("source_post_url", window.location.href);
	xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	xhr.open("POST", uploadEndPoint + keyAPI + sourcePostUrl + window.location.href);
	xhr.responseType = 'json';
	// xhr.timeout = 60000; // Si luego de este tiempo no se completa la solicitud entonces se cancela.

	xhr.upload.onprogress = function(event) {
		let timeLeft = new Date();
		timeLeft.setHours(0, 0, 0, 0);
		let progressBar = ventanas[2].children[2].children[1];
		let labelTimeEstimated = ventanas[2].children[2].children[2];
		const timeUntilFirstCall = ((Date.now() - iniTime) * event.total)/event.loaded;
		elapsedTime = Date.now() - iniTime;
		timeLeft.setMilliseconds((timeUntilFirstCall - elapsedTime > 0) ? (timeUntilFirstCall - elapsedTime) : 0);
		velocidad = event.loaded / (elapsedTime);
		estimatedTime = (elapsedTime * event.total) / event.loaded;
		partes = Math.floor((progressBar.childElementCount * event.loaded) / event.total);
		labelTimeEstimated.textContent = "Tiempo restante: " + ((estimatedTime >= 3600000) ? (timeLeft.getHours() + ":" + timeLeft.getMinutes() + ":" + timeLeft.getSeconds()) : (estimatedTime >= 60000) ? (timeLeft.getMinutes() + ":" + timeLeft.getSeconds()) : (timeLeft.getSeconds() + " segundos"));
		for(let i = loadedParts; i < partes; i++){
			progressBar.children[i].setAttribute("class", "loadFragment");
		}
		loadedParts = partes;
	};

	xhr.upload.onloadstart = function() {
		iniTime = Date.now();
	};

	xhr.upload.onerror = function (){
		window.alert("¡Ups! Esto es incómodo, no hemos podido subir tu GuifO.");
		allIsDone();
	};

	xhr.upload.onload = function (){
		let labelTimeEstimated = ventanas[2].children[2].children[2];
		labelTimeEstimated.textContent = "Estamos procesando tu gif.";
	};

	xhr.onloadend = function () { // Muestra un mensaje cuando se termina la transferencia de alguna manera, con error o exitosamente.
		alert("Tu gif está listo");
		cargaCompletada();
		let response = xhr.response;
		writeOnLocalStorage(response.data.id);
		if(secciones[1].children[1].childElementCount !=0){
	    while(secciones[1].children[1].lastElementChild){
	      secciones[1].children[1].removeChild(secciones[1].children[1].lastElementChild);
	    }
	  }
		getRandomId();
		secciones[1].style.display = "block";
	};

	xhr.send(formData);
}

/*FUNCIÓN CANCELAR SUBIR GUIFO*/

function cancelarSubida(){
	xhr.abort();
	ventanas[3].style.display = "none";
	allIsDone();
}

/*FUNCIÓN A SER INVOCADA EN CASO DE QUE SE COMPLETE LA SUBIDA DEL GIF*/

function cargaCompletada (){
	ventanas[2].style.display = "none";
	ventanas[3].style.display = "block";
	let imgTuGuifo = ventanas[3].children[2].children[0];
	imgTuGuifo.src = URLGif;
}

/*FUNCIÓN COPIAR ENLACE GUIFO*/

function copiarEnlaceGuifo (){
	navigator.permissions.query({
		name: "clipboard-write"
	}).then(permisos => {
		if(permisos.state === "granted" || permisos.state === "prompt"){
			navigator.clipboard.writeText(mgCollect.gifs[(mgCollect.gifs.length - 1)].urlGif).then(() => {
				window.alert("Enlace copiado correctamente");
			}, () => {
				window.alert("Por favor revisa si nos diste permiso de acceder a tu clipboard");
			});
		}
	}).catch(error => window.alert("¡Ups! Es necesario que nos des permiso para usa tu clipboard."));
}

/*FUNCIÓN DESCARGAR GUIFO*/

function descargarGuifo (){
	let linkGif = document.createElement("a");
	linkGif.href = URLGif;
	linkGif.style.display = "none";
	linkGif.download = mgCollect.gifs[mgCollect.gifs.length - 1].tagsGif[0].name + ".gif";
	linkGif.click();
}

/*FUNCIÓN TODO TERMINADO*/

function allIsDone (){
	if(camStream.active || cloneCamStream.active){
		offCamara();
	}

	if(ventanas[2].style.display === "block"){
		xhr.abort();
		ventanas[3].style.display = "none";
	}
	let logo = document.querySelector(".logo a");
	logo.click();
}

/*CONTROL DE GRABACIÓN*/

function offCamara (){

	if(camStream.active || cloneCamStream.active){
		videoElement.srcObject = null;
		camStream.getTracks()[0].stop();
		cloneCamStream.getTracks()[0].stop();
		isStop = true;
	}else{
		console.log("La cámara ya debe estar apagada, no hay tracks o actividad. Solo por validar si me genera algún error grabe.");
	}
}

/*CRONÓMETRO DECISEGUNDOS, SEGUNDOS, MINUTOS, Y HORAS*/

function cronometro (limite = 120, recOrPreview = false){

		let inputDate = (!recOrPreview) ? panels[1].children[0] : panels[2].children[0];
		let progressBar = panels[2].children[4];
		let unloadBarParts = panels[2].children[4].childElementCount;
		let loadedParts = 0;
		let value = 0;
    let decisegundos = 0, segundos = 0, minutos = 0, horas = 0, totalDeciSegundos = 0, cronometro = new Date();
    cronometro.setHours(0, 0, 0, 0);

		if(recOrPreview){
			panels[2].children[1].setAttribute("disabled", "true");
			for(let parte of progressBar.children){
					parte.setAttribute("class", "unloadFragment");
			}
		}

    elapsedTime = window.setInterval(function (){

        decisegundos ++;
				totalDeciSegundos ++;

				if(recOrPreview){
					loadedParts = Math.round((totalDeciSegundos*unloadBarParts) / (limite*10));
					if(loadedParts < 17){
						for(let i = value; i < loadedParts; i++){
							progressBar.children[i].setAttribute("class", "loadFragment");
						}
						value = loadedParts;
					}
				}


				if(decisegundos == 10){
					decisegundos = 0;
					segundos ++;
				}

        if (segundos == 60){
            minutos ++;
            segundos = 0;
        }
        if(minutos == 60){
            horas ++;
            minutos = 0;
        }
        cronometro.setHours(horas, minutos, segundos, decisegundos);

        if(limite - segundos <= 0){
            window.clearInterval(elapsedTime);
						if(recOrPreview === true){
							gif.style.display = "none";
							poster.style.display = "block";
							panels[2].children[1].removeAttribute("disabled");
						}
        }
        inputDate.value = ((cronometro.getHours() < 10) ? "0" + cronometro.getHours() : cronometro.getHours()) + ":" + ((cronometro.getMinutes() < 10) ? "0" + cronometro.getMinutes() : cronometro.getMinutes()) + ":" + ((cronometro.getSeconds() < 10) ? "0" + cronometro.getSeconds() : cronometro.getSeconds()) + ":" + ((cronometro.getMilliseconds() < 10) ? "0" + cronometro.getMilliseconds() : cronometro.getMilliseconds());
    }, 100);

}
