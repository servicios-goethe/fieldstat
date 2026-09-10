const SHEET_ID = '1gxOF3cvMOuDaWMqrZ9WFMgQDMK8cb1y-pMUd0Zuyn1U'; // <--- ¡RECUERDA CAMBIAR ESTO!
//FieldStats5.3
function doGet(e) {
  if (e.parameter.confirmar) {
    try {
      const doc = SpreadsheetApp.openById(SHEET_ID);
      const hoja = doc.getSheetByName('USUARIOS');
      const datos = hoja.getDataRange().getValues();
      for (let i = 1; i < datos.length; i++) {
        if (datos[i][0] == e.parameter.confirmar) {
          hoja.getRange(i + 1, 4).setValue('Si'); 
          return HtmlService.createHtmlOutput('<h2>¡Correo confirmado con éxito!</h2><p>Ya puedes iniciar sesión en FieldStats.</p>');
        }
      }
      return HtmlService.createHtmlOutput('Usuario no encontrado.');
    } catch(err) {
      return HtmlService.createHtmlOutput('Error confirmando correo.');
    }
  }

  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('FieldStats MVP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }

function formatearHora(horaObj) {
  if (!horaObj) return "";
  if (typeof horaObj === 'string') return horaObj;
  if (horaObj instanceof Date) {
    let h = String(horaObj.getHours()).padStart(2, '0');
    let m = String(horaObj.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  return String(horaObj);
}

function formatearFecha(fechaObj) {
  if (!fechaObj) return "";
  if (typeof fechaObj === 'string') return fechaObj; 
  let dia = String(fechaObj.getDate()).padStart(2, '0');
  let mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
  let anio = fechaObj.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function hashPassword(password) {
  const salt = "GoetheFieldStats_2026_MVP!"; 
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  return rawHash.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

// ----------------- MODULO USUARIOS -----------------

function verificarLogin(usuario, password) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    let hoja = doc.getSheetByName('USUARIOS');
    if (!hoja) return { success: false, msg: 'Tabla de USUARIOS no configurada.' };

    const datos = hoja.getDataRange().getValues();
    const passHash = hashPassword(password);
    
    for (let i = 1; i < datos.length; i++) {
      if ((datos[i][0] == usuario || datos[i][5] == usuario) && datos[i][1] == passHash) {
        if (datos[i][3] !== 'Si') return { success: false, msg: 'Cuenta no confirmada.' };
        if (datos[i][4] !== 'Si') return { success: false, msg: 'Cuenta no activada.' };
        return { success: true, role: datos[i][2], dni: String(datos[i][0]) };
      }
    }
    if (usuario === 'hernan' && password === 'profe123') return { success: true, role: 'profesor' };
    return { success: false, msg: 'Usuario o contraseña incorrectos' };
  } catch (error) { return { success: false, msg: 'Error de conexión.' }; }
}

function registrarCuentaJugador(dni, token, password) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    let hoja = doc.getSheetByName('USUARIOS');
    if (token !== "JUGADOR2026") return { success: false, msg: 'Token inválido.' };
    
    const datos = hoja.getDataRange().getValues();
    let filaUsuario = -1;
    for(let i=1; i<datos.length; i++) {
      if(datos[i][0] == dni && datos[i][2] === 'jugador') {
        filaUsuario = i + 1;
        if(datos[i][4] === 'Si') return { success: false, msg: 'Cuenta ya activada.' };
        break;
      }
    }
    if(filaUsuario === -1) return { success: false, msg: 'DNI no registrado por un profesor.' };
    
    hoja.getRange(filaUsuario, 2).setValue(hashPassword(password));
    hoja.getRange(filaUsuario, 5).setValue('Si');
    return { success: true };
  } catch (e) { return { success: false, msg: e.toString() }; }
}

function registrarExterno(email, password) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    let hoja = doc.getSheetByName('USUARIOS');
    if (!hoja) {
      hoja = doc.insertSheet('USUARIOS');
      hoja.appendRow(['ID_Usuario', 'PasswordHash', 'Rol', 'Confirmado', 'Activado', 'Email']);
    }
    const datos = hoja.getDataRange().getValues();
    for(let i=1; i<datos.length; i++) {
      if(datos[i][0] == email) return { success: false, msg: 'Email ya registrado.' };
    }
    hoja.appendRow([email, hashPassword(password), 'externo', 'No', 'Si', email]); 
    const link = ScriptApp.getService().getUrl() + "?confirmar=" + email;
    GmailApp.sendEmail(email, "Confirma tu cuenta en FieldStats", "Haz clic: " + link);
    return { success: true };
  } catch (e) { return { success: false, msg: e.toString() }; }
}

// ----------------- MODULO JUGADORES -----------------

function calcularCategoria(fnacStr) {
  if (!fnacStr) return "Cadetes";
  let fecha;
  if (fnacStr instanceof Date) {
    fecha = fnacStr;
  } else {
    fecha = new Date(fnacStr);
    if (isNaN(fecha.getTime())) return "Cadetes";
  }
  
  const mesNac = fecha.getMonth() + 1; // 1-12
  const anioNac = fecha.getFullYear();
  const anioActual = new Date().getFullYear();
  
  // Año escolar: diferencia de años - 11 (1° secundaria ≈ 12 años)
  // Pero ajustado por el corte julio: los "grandes" (jul-dic) arrancan un año antes
  const esGrande = mesNac >= 7;
  let anioEscolar = anioActual - anioNac - 11;
  if (esGrande) anioEscolar = anioEscolar; // grande del año anterior
  else anioEscolar = anioEscolar; // chico del año actual
  
  // Clamp: si queda fuera de rango 1-6, asignamos borde
  if (anioEscolar < 1) return "Menores";
  if (anioEscolar > 6) return "Juveniles";
  
  if (esGrande) {
    if (anioEscolar <= 2) return "Menores";
    if (anioEscolar <= 4) return "Cadetes";
    return "Juveniles";
  }
  
  // Chicos (nacidos ene-jun)
  if (anioEscolar <= 3) return "Menores";
  if (anioEscolar <= 5) return "Cadetes";
  return "Juveniles";
}

function registrarJugadorBackend(datos) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const dniStr = String(datos.dni).trim();
    
    // 1. Verificar si el alumno YA EXISTE en la base general
    let hojaGen = doc.getSheetByName('JUGADORES_GENERAL');
    const datosGen = hojaGen.getDataRange().getValues();
    let existeEnGeneral = false;
    for(let i=1; i<datosGen.length; i++) {
      // Comparación ultra-estricta como String y sin espacios
      if(String(datosGen[i][0]).trim() === dniStr) { existeEnGeneral = true; break; }
    }

    // 2. Si NO existe en general, registrarlo
    if (!existeEnGeneral) {
      hojaGen.appendRow([dniStr, datos.nombre, datos.apellido, datos.email, datos.fnac, 'Goethe']);
      let hojaUsu = doc.getSheetByName('USUARIOS');
      if (hojaUsu) {
        hojaUsu.appendRow([dniStr, '', 'jugador', 'Si', 'No', datos.email]);
      }
    }

    // 3. Ahora manejamos los DEPORTES (esto es lo que se puede repetir)
    let hojaDep = doc.getSheetByName('JUGADORES_DEPORTES');
    const datosDep = hojaDep.getDataRange().getValues();
    const cat = calcularCategoria(datos.fnac);

    for (let depID of datos.deportes) {
      let camiseta = datos.camisetas[depID];
      let idj = dniStr + "-" + depID;
      
      // Validar si ya hace este deporte o si la camiseta está ocupada
      for(let j=1; j<datosDep.length; j++) {
        if(String(datosDep[j][0]) === idj) return { success: false, msg: `El alumno ya está registrado en ${depID}.` };
        if(datosDep[j][2] === depID && datosDep[j][3] === cat && String(datosDep[j][4]) === String(camiseta)) {
          return { success: false, msg: `La camiseta ${camiseta} ya está ocupada en ${depID} - ${cat}.` };
        }
      }
      // Si pasó los filtros, lo agregamos al deporte
      hojaDep.appendRow([idj, dniStr, depID, cat, camiseta]);
    }

    return { success: true, msg: existeEnGeneral ? "Deporte agregado a alumno existente." : "Alumno registrado con éxito." };
  } catch(e) { return { success: false, msg: e.toString() }; }
}

function obtenerJugadores(deporteIDD, categoriaOpcional) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hojaGen = doc.getSheetByName('JUGADORES_GENERAL');
    const hojaDep = doc.getSheetByName('JUGADORES_DEPORTES');
    const hojaUsu = doc.getSheetByName('USUARIOS');
    
    if (!hojaGen || !hojaDep || !hojaUsu) return [];
    const datosGen = hojaGen.getDataRange().getValues();
    const datosDep = hojaDep.getDataRange().getValues();
    const datosUsu = hojaUsu.getDataRange().getValues();
    
    // Mapa de usuarios activados (usamos String para evitar líos de tipos)
    let usuariosActivados = {};
    for (let i = 1; i < datosUsu.length; i++) {
      if (datosUsu[i][2] === 'jugador' && datosUsu[i][4] === 'Si') {
        usuariosActivados[String(datosUsu[i][0])] = true; 
      }
    }
    
    let mapaJugadores = {};
    for (let i = 1; i < datosGen.length; i++) {
      mapaJugadores[String(datosGen[i][0])] = { nombre: datosGen[i][1], apellido: datosGen[i][2] };
    }
    
    let jugadores = [];
    for (let i = 1; i < datosDep.length; i++) {
      if (datosDep[i][2] == deporteIDD) {
        if (categoriaOpcional && datosDep[i][3] !== categoriaOpcional) continue;
        let dni = String(datosDep[i][1]);
        if (usuariosActivados[dni]) {
          let info = mapaJugadores[dni];
          if (info) jugadores.push({ id: dni, nombreCompleto: info.nombre + " " + info.apellido, idd: deporteIDD });
        }
      }
    }
    return jugadores;
  } catch (error) { return []; }
}

function guardarAsistenciaBD(datosAsistencia, deporteIDD) {
  try {
    const libro = SpreadsheetApp.openById(SHEET_ID);
    let hoja = libro.getSheetByName('Asistencia');
    if (!hoja) {
      hoja = libro.insertSheet('Asistencia');
      hoja.appendRow(['Fecha', 'IDD', 'ID_Jugador', 'Nombre', 'Asistió']);
    }
    
    const fechaHoyStr = formatearFecha(new Date());
    const datosActuales = hoja.getDataRange().getValues();
    
    datosAsistencia.forEach(function(registro) {
      let filaExistente = -1;
      for (let i = datosActuales.length - 1; i > 0; i--) {
        if (formatearFecha(datosActuales[i][0]) === fechaHoyStr && datosActuales[i][1] == registro.idd && datosActuales[i][2] == registro.id) {
          filaExistente = i + 1; break;
        }
      }
      let valor = registro.presente ? 'Sí' : 'No';
      if (filaExistente !== -1) hoja.getRange(filaExistente, 5).setValue(valor);
      else {
        hoja.appendRow([fechaHoyStr, registro.idd, registro.id, registro.nombreCompleto, valor]);
        datosActuales.push([fechaHoyStr, registro.idd, registro.id, registro.nombreCompleto, valor]);
      }
    });
    return { success: true };
  } catch (error) { return { success: false, msg: error.toString() }; }
}

// ----------------- MODULO PARTIDOS Y CONVOCATORIAS -----------------

function obtenerPartidosFiltrados(deporteIDD, estado) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hoja = doc.getSheetByName('PARTIDOS');
    if(!hoja) return [];
    const datos = hoja.getDataRange().getValues();
    let filtrados = [];

    for(let i=1; i<datos.length; i++) {
      // Normalizamos deporte y estado para evitar errores de tipeo
      let depSheet = String(datos[i][3]).trim().toUpperCase();
      let estSheet = String(datos[i][9]).trim().toUpperCase();
      let depTarget = String(deporteIDD).trim().toUpperCase();
      let estTarget = String(estado).trim().toUpperCase();

      if(depSheet === depTarget && estSheet === estTarget) {
        let label = `${datos[i][1]} vs ${datos[i][2]} (${formatearFecha(datos[i][5])}) - ${datos[i][4]}`;
        filtrados.push({ idp: String(datos[i][0]).trim(), label: label });
      }
    }
    return filtrados;
  } catch(e) { return []; }
}

function obtenerPlantelConfirmado(idp) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hojaConv = doc.getSheetByName('CONVOCATORIAS');
    const hojaGen = doc.getSheetByName('JUGADORES_GENERAL');
    if(!hojaConv || !hojaGen) return [];

    const datosConv = hojaConv.getDataRange().getValues();
    const datosGen = hojaGen.getDataRange().getValues();
    
    let nombres = {};
    for(let i=1; i<datosGen.length; i++) nombres[datosGen[i][0]] = datosGen[i][1] + " " + datosGen[i][2];

    let plantel = [];
    for(let i=1; i<datosConv.length; i++) {
      if(datosConv[i][0] == idp && datosConv[i][2] == 'Si') {
        plantel.push({ 
          nombre: nombres[datosConv[i][1]] || 'Desconocido', 
          titular: datosConv[i][3] == 'Si' 
        });
      }
    }
    return plantel;
  } catch(e) { return []; }
}

function resetearEstadisticasPartido(idp) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    let hojaEst = doc.getSheetByName('ESTADISTICAS_PARTIDOS');
    if(!hojaEst) return { success: true };
    
    let datos = hojaEst.getDataRange().getValues();
    for (let i = datos.length - 1; i >= 1; i--) {
      if (datos[i][0] == idp) hojaEst.deleteRow(i + 1);
    }
    return { success: true };
  } catch(e) { return { success: false, msg: e.toString() }; }
}

function crearPartidosBD(datosPartido) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    let hoja = doc.getSheetByName('PARTIDOS');
    if (!hoja) {
      hoja = doc.insertSheet('PARTIDOS');
      hoja.appendRow(['IDP', 'Local', 'Visitante', 'Deporte', 'Categoria', 'Fecha', 'Hora', 'GolesLocal', 'GolesVisitante', 'Estado']);
    }
    
    const fechaLimpia = datosPartido.fecha.replace(/-/g, '');
    datosPartido.categorias.forEach(cat => {
      let idp = `PAR-${datosPartido.deporte}-${cat}-${fechaLimpia}`;
      hoja.appendRow([idp, 'Goethe', datosPartido.visitante, datosPartido.deporte, cat, datosPartido.fecha, datosPartido.hora, 0, 0, 'Pendiente']);
    });
    return { success: true };
  } catch(e) { return { success: false, msg: e.toString() }; }
}

function obtenerJugadoresParaConvocatoria(idp) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hojaPar = doc.getSheetByName('PARTIDOS');
    const datosPar = hojaPar.getDataRange().getValues();
    
    let deporte = ''; let categoria = '';
    for(let i=1; i<datosPar.length; i++){
      if(datosPar[i][0] == idp) { deporte = datosPar[i][3]; categoria = datosPar[i][4]; break; }
    }
    
    // Traemos a todos los activos de esa categoria
    const jugadoresBase = obtenerJugadores(deporte, categoria);
    
    // Buscar si ya tienen convocatoria previa para UPSERT
    let hojaConv = doc.getSheetByName('CONVOCATORIAS');
    if(!hojaConv) return jugadoresBase.map(j => ({...j, convocado: true, titular: false}));
    
    const datosConv = hojaConv.getDataRange().getValues();
    return jugadoresBase.map(j => {
      let convocado = false; let titular = false; let encontrado = false;
      for(let i=datosConv.length-1; i>0; i--) {
        if(datosConv[i][0] == idp && datosConv[i][1] == j.id) {
          convocado = (datosConv[i][2] == 'Si'); titular = (datosConv[i][3] == 'Si');
          encontrado = true; break;
        }
      }
      return {...j, convocado: encontrado ? convocado : true, titular: titular};
    });
  } catch(e) { return []; }
}

function guardarConvocatoriaBD(idp, datosConv) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    let hoja = doc.getSheetByName('CONVOCATORIAS');
    if (!hoja) {
      hoja = doc.insertSheet('CONVOCATORIAS');
      hoja.appendRow(['IDP', 'ID_Jugador', 'Convocado', 'Titular', 'Confirmado']);
    }
    
    const datosActuales = hoja.getDataRange().getValues();
    datosConv.forEach(jug => {
      let filaExistente = -1;
      for(let i=datosActuales.length-1; i>0; i--) {
        if(datosActuales[i][0] == idp && datosActuales[i][1] == jug.id) { filaExistente = i+1; break; }
      }
      let vConv = jug.convocado ? 'Si' : 'No';
      let vTit = jug.titular ? 'Si' : 'No';
      
      if(filaExistente !== -1) {
        hoja.getRange(filaExistente, 3).setValue(vConv);
        hoja.getRange(filaExistente, 4).setValue(vTit);
      } else {
        hoja.appendRow([idp, jug.id, vConv, vTit, '']); // Columna Confirmado se inicializa vacía
        datosActuales.push([idp, jug.id, vConv, vTit, '']);
      }
    });
    return { success: true };
  } catch(e) { return { success: false, msg: e.toString() }; }
}

// Trae los jugadores para la pantalla de convocatorias del profesor
function obtenerJugadoresParaConvocatoria(idp) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hojaPar = doc.getSheetByName('PARTIDOS');
    const datosPar = hojaPar.getDataRange().getValues();
    
    let deporte = ''; let categoria = '';
    for(let i=1; i<datosPar.length; i++){
      if(datosPar[i][0] == idp) { deporte = datosPar[i][3]; categoria = datosPar[i][4]; break; }
    }
    
    // Traemos a todos los activos de esa categoria
    const jugadoresBase = obtenerJugadores(deporte, categoria);
    
    // Buscar si ya tienen convocatoria previa para UPSERT
    let hojaConv = doc.getSheetByName('CONVOCATORIAS');
    if(!hojaConv) return jugadoresBase.map(j => ({...j, convocado: true, titular: false, confirmado: ''}));
    
    const datosConv = hojaConv.getDataRange().getValues();
    return jugadoresBase.map(j => {
      let convocado = false; let titular = false; let encontrado = false; let confirmado = '';
      for(let i=datosConv.length-1; i>0; i--) {
        if(datosConv[i][0] == idp && datosConv[i][1] == j.id) {
          convocado = (datosConv[i][2] == 'Si'); 
          titular = (datosConv[i][3] == 'Si');
          confirmado = datosConv[i][4] || ''; // Columna 5 (Confirmado)
          encontrado = true; 
          break;
        }
      }
      return {...j, convocado: encontrado ? convocado : true, titular: titular, confirmado: confirmado};
    });
  } catch(e) { return []; }
}

// Carga definitiva de estadísticas del partido
function guardarPartidoFinalizadoBD(idp, golesGoethe, golesRival, logGoles) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    let hojaPar = doc.getSheetByName('PARTIDOS');
    const datosPar = hojaPar.getDataRange().getValues();
    
    // 1. Actualizar resultado
    for(let i=1; i<datosPar.length; i++) {
      if(datosPar[i][0] == idp) {
        hojaPar.getRange(i+1, 8).setValue(golesGoethe);
        hojaPar.getRange(i+1, 9).setValue(golesRival);
        hojaPar.getRange(i+1, 10).setValue('Finalizado');
        break;
      }
    }
    
    // 2. Guardar cada gol en ESTADISTICAS_PARTIDOS
    if(logGoles.length > 0) {
      let hojaEst = doc.getSheetByName('ESTADISTICAS_PARTIDOS');
      if (!hojaEst) {
        hojaEst = doc.insertSheet('ESTADISTICAS_PARTIDOS');
        hojaEst.appendRow(['IDP', 'ID_Goleador', 'ID_Asistidor']);
      }
      logGoles.forEach(gol => {
        hojaEst.appendRow([idp, gol.idGoleador, gol.idAsistidor || '']);
      });
    }
    return { success: true };
  } catch(e) { return { success: false, msg: e.toString() }; }
}

// ----------------- NUEVOS MODULOS ESTADISTICOS DASHBOARDS -----------------

function obtenerDashboardAdmin(deporteIDD) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hojaPar = doc.getSheetByName('PARTIDOS');
    const hojaEst = doc.getSheetByName('ESTADISTICAS_PARTIDOS');
    const hojaConv = doc.getSheetByName('CONVOCATORIAS');
    const hojaGen = doc.getSheetByName('JUGADORES_GENERAL');
    
    if(!hojaPar || !hojaEst || !hojaConv || !hojaGen) return [];
    
    const datosPar = hojaPar.getDataRange().getValues();
    const datosEst = hojaEst.getDataRange().getValues();
    const datosConv = hojaConv.getDataRange().getValues();
    const datosGen = hojaGen.getDataRange().getValues();
    
    let nombres = {};
    for(let i=1; i<datosGen.length; i++) {
      nombres[String(datosGen[i][0])] = datosGen[i][1] + " " + datosGen[i][2];
    }
    
    let partidosFinalizados = [];
    for(let i=1; i<datosPar.length; i++) {
      if(String(datosPar[i][3]).trim().toUpperCase() === String(deporteIDD).trim().toUpperCase() && String(datosPar[i][9]).trim().toUpperCase() === 'FINALIZADO') {
        let idp = String(datosPar[i][0]);
        let label = `${datosPar[i][1]} ${datosPar[i][7]} - ${datosPar[i][8]} ${datosPar[i][2]} (${formatearFecha(datosPar[i][5])})`;
        
        let statsJugadores = {};
        for(let j=1; j<datosConv.length; j++) {
          if(String(datosConv[j][0]) === idp && datosConv[j][2] === 'Si') {
            let idj = String(datosConv[j][1]);
            statsJugadores[idj] = { nombre: nombres[idj] || idj, goles: 0, asistencias: 0 };
          }
        }
        
        for(let k=1; k<datosEst.length; k++) {
          if(String(datosEst[k][0]) === idp) {
            let goleador = String(datosEst[k][1]);
            let asistidor = String(datosEst[k][2]);
            if(statsJugadores[goleador]) statsJugadores[goleador].goles++;
            if(asistidor && statsJugadores[asistidor]) statsJugadores[asistidor].asistencias++;
          }
        }
        
        partidosFinalizados.push({ idp: idp, label: label, stats: statsJugadores });
      }
    }
    return partidosFinalizados.reverse();
  } catch(e) { return []; }
}

function obtenerEstadisticasJugador(dni) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hojaConv = doc.getSheetByName('CONVOCATORIAS');
    const hojaEst = doc.getSheetByName('ESTADISTICAS_PARTIDOS');
    const hojaPar = doc.getSheetByName('PARTIDOS');
    if(!hojaConv || !hojaEst || !hojaPar) return null;
    
    const datosConv = hojaConv.getDataRange().getValues();
    const datosEst = hojaEst.getDataRange().getValues();
    const datosPar = hojaPar.getDataRange().getValues();
    
    let partidosJugados = 0;
    let golesTotales = 0;
    let asistenciasTotales = 0;
    let historialPartidos = [];
    
    let idpsFinalizados = {};
    let infoPartidos = {};
    for(let i=1; i<datosPar.length; i++) {
      if(String(datosPar[i][9]).trim().toUpperCase() === 'FINALIZADO') {
        let idp = String(datosPar[i][0]);
        idpsFinalizados[idp] = true;
        infoPartidos[idp] = `${datosPar[i][1]} ${datosPar[i][7]} - ${datosPar[i][8]} ${datosPar[i][2]} (${formatearFecha(datosPar[i][5])})`;
      }
    }
    
    for(let i=1; i<datosConv.length; i++) {
      if(String(datosConv[i][1]) === String(dni) && datosConv[i][2] === 'Si') {
        let idp = String(datosConv[i][0]);
        if(idpsFinalizados[idp]) {
          partidosJugados++;
          historialPartidos.push(infoPartidos[idp]);
        }
      }
    }
    
    for(let i=1; i<datosEst.length; i++) {
      if(String(datosEst[i][1]) === String(dni)) golesTotales++;
      if(String(datosEst[i][2]) === String(dni)) asistenciasTotales++;
    }
    
    return { 
      partidosJugados: partidosJugados, 
      golesTotales: golesTotales, 
      asistenciasTotales: asistenciasTotales,
      promedioGoles: partidosJugados > 0 ? (golesTotales / partidosJugados).toFixed(2) : 0,
      historial: historialPartidos
    };
  } catch(e) { return null; }
}

function obtenerMisConvocatorias(dni) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hojaConv = doc.getSheetByName('CONVOCATORIAS');
    const hojaPar = doc.getSheetByName('PARTIDOS');
    if(!hojaConv || !hojaPar) return [];
    
    const datosConv = hojaConv.getDataRange().getValues();
    const datosPar = hojaPar.getDataRange().getValues();
    
    let idpsPendientes = {};
    for(let i=1; i<datosPar.length; i++) {
      if(String(datosPar[i][9]).trim().toUpperCase() === 'PENDIENTE') {
        let idp = String(datosPar[i][0]);
        let horaStr = formatearHora(datosPar[i][6]);
        let horaSeparador = horaStr ? ` - ${horaStr}` : '';
        idpsPendientes[idp] = {
          label: `${datosPar[i][1]} vs ${datosPar[i][2]} - ${formatearFecha(datosPar[i][5])}${horaSeparador}`,
          deporte: String(datosPar[i][3]).trim()
        };
      }
    }
    
    let misConvocatorias = [];
    for(let i=1; i<datosConv.length; i++) {
      if(String(datosConv[i][1]) === String(dni) && datosConv[i][2] === 'Si') {
        let idp = String(datosConv[i][0]);
        if(idpsPendientes[idp]) {
          let confirmadoVal = datosConv[i][4] || ''; // Columna 5 (Confirmado)
          misConvocatorias.push({ 
            idp: idp, 
            label: idpsPendientes[idp].label,
            deporte: idpsPendientes[idp].deporte,
            titular: datosConv[i][3] === 'Si',
            confirmado: confirmadoVal
          });
        }
      }
    }
    return misConvocatorias;
  } catch(e) { return []; }
}

function responderConvocatoria(idp, dni, asiste) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    let hoja = doc.getSheetByName('CONVOCATORIAS');
    if (!hoja) return { success: false, msg: 'Tabla de CONVOCATORIAS no configurada.' };
    
    // Aseguramos que la columna E tenga su encabezado "Confirmado" si está vacía
    if (hoja.getRange(1, 5).getValue() === "") {
      hoja.getRange(1, 5).setValue("Confirmado");
    }
    
    const datos = hoja.getDataRange().getValues();
    let filaExistente = -1;
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][0] == idp && datos[i][1] == dni) {
        filaExistente = i + 1;
        break;
      }
    }
    
    if (filaExistente === -1) {
      return { success: false, msg: 'No estás convocado a este partido.' };
    }
    
    const valorConfirmacion = asiste ? 'Si' : 'No';
    hoja.getRange(filaExistente, 5).setValue(valorConfirmacion); // Columna 5 (índice 4) es Confirmado
    return { success: true };
  } catch (error) {
    return { success: false, msg: error.toString() };
  }
}

function obtenerEstadisticasJugadorCompleto(dni) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hojaGen = doc.getSheetByName('JUGADORES_GENERAL');
    const hojaDep = doc.getSheetByName('JUGADORES_DEPORTES');
    const hojaConv = doc.getSheetByName('CONVOCATORIAS');
    const hojaEst = doc.getSheetByName('ESTADISTICAS_PARTIDOS');
    const hojaPar = doc.getSheetByName('PARTIDOS');
    const hojaAsis = doc.getSheetByName('Asistencia');
    
    if(!hojaDep) return { success: false, msg: 'Error: Tabla JUGADORES_DEPORTES no configurada.' };
    
    const datosDep = hojaDep.getDataRange().getValues();
    const dniStr = String(dni).trim();
    
    // Find all sports player is registered in
    let sportsActive = [];
    let sportsInfo = {}; // sportId -> category
    for(let i=1; i<datosDep.length; i++) {
      if(String(datosDep[i][1]).trim() === dniStr) {
        let sportId = String(datosDep[i][2]).trim();
        let cat = String(datosDep[i][3]).trim();
        sportsActive.push(sportId);
        sportsInfo[sportId] = cat;
      }
    }
    
    if(sportsActive.length === 0) {
      return { success: false, msg: 'No se encontraron deportes registrados para este alumno.' };
    }
    
    // Get all completed match IDs and sport mapping
    const datosPar = hojaPar ? hojaPar.getDataRange().getValues() : [];
    let partidosFinalizados = {}; // idp -> { deporte, categoria }
    let totalPartidosPorDeporteCat = {}; // sportId_category -> count of finalized matches
    
    for(let i=1; i<datosPar.length; i++) {
      let idp = String(datosPar[i][0]).trim();
      let local = String(datosPar[i][1]).trim();
      let visita = String(datosPar[i][2]).trim();
      let dep = String(datosPar[i][3]).trim();
      let cat = String(datosPar[i][4]).trim();
      let estado = String(datosPar[i][9]).trim().toUpperCase();
      
      if(estado === 'FINALIZADO') {
        partidosFinalizados[idp] = { deporte: dep, categoria: cat };
        let key = dep + "_" + cat;
        totalPartidosPorDeporteCat[key] = (totalPartidosPorDeporteCat[key] || 0) + 1;
      }
    }
    
    // Calculate match participations and convocations
    const datosConv = hojaConv ? hojaConv.getDataRange().getValues() : [];
    let convocadoFinalizadosPorDeporte = {}; // sportId -> count
    let convocadoTotalPorDeporteCat = {}; // sportId_category -> count of all convocations of this player in this category
    
    for(let i=1; i<datosConv.length; i++) {
      let idp = String(datosConv[i][0]).trim();
      let idJug = String(datosConv[i][1]).trim();
      let convocado = String(datosConv[i][2]).trim().toUpperCase() === 'SI';
      
      if(idJug === dniStr) {
        // If it's a finalized match
        if(partidosFinalizados[idp]) {
          let dep = partidosFinalizados[idp].deporte;
          let cat = partidosFinalizados[idp].categoria;
          if(convocado) {
            convocadoFinalizadosPorDeporte[dep] = (convocadoFinalizadosPorDeporte[dep] || 0) + 1;
          }
        }
        
        // Also compute overall convocation rate for finalized matches in their category
        if(partidosFinalizados[idp]) {
          let dep = partidosFinalizados[idp].deporte;
          let cat = partidosFinalizados[idp].categoria;
          if(convocado) {
            let key = dep + "_" + cat;
            convocadoTotalPorDeporteCat[key] = (convocadoTotalPorDeporteCat[key] || 0) + 1;
          }
        }
      }
    }
    
    // Calculate goals and assists from ESTADISTICAS_PARTIDOS
    const datosEst = hojaEst ? hojaEst.getDataRange().getValues() : [];
    let golesPorDeporte = {};
    let asistenciasPorDeporte = {};
    
    for(let i=1; i<datosEst.length; i++) {
      let idp = String(datosEst[i][0]).trim();
      let goleador = String(datosEst[i][1]).trim();
      let asistidor = String(datosEst[i][2]).trim();
      
      if(goleador === dniStr || asistidor === dniStr) {
        let matchInfo = partidosFinalizados[idp];
        if(matchInfo) {
          let dep = matchInfo.deporte;
          if(goleador === dniStr) {
            golesPorDeporte[dep] = (golesPorDeporte[dep] || 0) + 1;
          }
          if(asistidor === dniStr) {
            asistenciasPorDeporte[dep] = (asistenciasPorDeporte[dep] || 0) + 1;
          }
        }
      }
    }
    
    // Calculate Attendance from Asistencia sheet
    const datosAsis = hojaAsis ? hojaAsis.getDataRange().getValues() : [];
    let totalAsistenciasPorDeporte = {};
    let presentesPorDeporte = {};
    
    for(let i=1; i<datosAsis.length; i++) {
      let dep = String(datosAsis[i][1]).trim();
      let idJug = String(datosAsis[i][2]).trim();
      let asistio = String(datosAsis[i][4]).trim().toUpperCase();
      
      if(idJug === dniStr) {
        totalAsistenciasPorDeporte[dep] = (totalAsistenciasPorDeporte[dep] || 0) + 1;
        if(asistio === 'SÍ' || asistio === 'SI') {
          presentesPorDeporte[dep] = (presentesPorDeporte[dep] || 0) + 1;
        }
      }
    }
    
    // Build final statistics result for each sport the player plays
    let result = {
      sports: sportsActive,
      stats: {}
    };
    
    const labelDeportes = {
      'DEP1': 'Fútbol',
      'DEP2': 'Handball'
    };
    
    sportsActive.forEach(sportId => {
      let cat = sportsInfo[sportId] || 'General';
      let label = labelDeportes[sportId] || sportId;
      
      let partidosJugados = convocadoFinalizadosPorDeporte[sportId] || 0;
      let goles = golesPorDeporte[sportId] || 0;
      let asistencias = asistenciasPorDeporte[sportId] || 0;
      
      let promGoles = partidosJugados > 0 ? (goles / partidosJugados).toFixed(2) : '0.00';
      let promAsis = partidosJugados > 0 ? (asistencias / partidosJugados).toFixed(2) : '0.00';
      
      let key = sportId + "_" + cat;
      let totalPartidosCat = totalPartidosPorDeporteCat[key] || 0;
      let convocadoPartidosCat = convocadoTotalPorDeporteCat[key] || 0;
      let convocatoriasPorcentaje = totalPartidosCat > 0 ? Math.round((convocadoPartidosCat / totalPartidosCat) * 100) : 100;
      
      let totalAsisCount = totalAsistenciasPorDeporte[sportId] || 0;
      let presentesCount = presentesPorDeporte[sportId] || 0;
      let asistenciaClasesPorcentaje = totalAsisCount > 0 ? Math.round((presentesCount / totalAsisCount) * 100) : 100;
      
      result.stats[sportId] = {
        deporteLabel: label,
        categoria: cat,
        partidosJugados: partidosJugados,
        goles: goles,
        asistencias: asistencias,
        promedioGoles: promGoles,
        promedioAsistencias: promAsis,
        convocatoriasPorcentaje: convocatoriasPorcentaje,
        asistenciaClasesPorcentaje: asistenciaClasesPorcentaje
      };
    });
    
    return { success: true, data: result };
    
  } catch(e) {
    return { success: false, msg: 'Error al obtener estadísticas: ' + e.toString() };
  }
}
// ═══════════════════════════════════════════════════════════════════════════
//  NUEVAS FUNCIONES PARA AGREGAR AL Code.gs
//  Pegar ANTES del cierre del archivo (después de obtenerEstadisticasJugadorCompleto)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * obtenerPartidosDashboard(deporteIDD, categoria, estado)
 *
 * Devuelve los partidos de un deporte/categoría filtrados por estado
 * ('Pendiente' o 'Finalizado') con todos los datos necesarios para el
 * render del fixture en el dashboard de jugador y profesor.
 *
 * Hojas usadas: PARTIDOS
 */
function obtenerPartidosDashboard(deporteIDD, categoria, estado) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hoja = doc.getSheetByName('PARTIDOS');
    if (!hoja) return [];

    const datos = hoja.getDataRange().getValues();
    const depTarget  = String(deporteIDD).trim().toUpperCase();
    const catTarget  = String(categoria).trim().toLowerCase();
    const estTarget  = String(estado).trim().toUpperCase();

    let resultado = [];

    for (let i = 1; i < datos.length; i++) {
      const depSheet  = String(datos[i][3]).trim().toUpperCase();
      const catSheet  = String(datos[i][4]).trim().toLowerCase();
      const estSheet  = String(datos[i][9]).trim().toUpperCase();

      if (depSheet !== depTarget) continue;
      if (catSheet !== catTarget) continue;
      if (estSheet !== estTarget) continue;

      resultado.push({
        idp:        String(datos[i][0]).trim(),
        local:      String(datos[i][1]).trim(),
        visitante:  String(datos[i][2]).trim(),
        deporte:    String(datos[i][3]).trim(),
        categoria:  String(datos[i][4]).trim(),
        fecha:      formatearFecha(datos[i][5]),
        hora:       formatearHora(datos[i][6]),
        golesLocal: datos[i][7] !== '' ? Number(datos[i][7]) : null,
        golesVisita:datos[i][8] !== '' ? Number(datos[i][8]) : null,
        estado:     String(datos[i][9]).trim(),
        // label auxiliar para mostrar en tarjeta
        label:      String(datos[i][4]).trim() + ' · ' + formatearFecha(datos[i][5])
      });
    }

    // Ordenar: más recientes primero para disputados, próximos primero para pendientes
    resultado.sort((a, b) => {
      // comparación simple de string de fecha DD/MM/AAAA
      const fa = a.fecha.split('/').reverse().join('');
      const fb = b.fecha.split('/').reverse().join('');
      return estTarget === 'FINALIZADO' ? fb.localeCompare(fa) : fa.localeCompare(fb);
    });

    return resultado;
  } catch (e) {
    return [];
  }
}

/**
 * obtenerTablaPosiciones(deporteIDD, categoria)
 *
 * Calcula la tabla de posiciones a partir de los partidos finalizados
 * de la hoja PARTIDOS.  Acumula PJ, G, E, P, GF, GC, Pts para cada
 * equipo que haya participado.  Goethe siempre aparece como local.
 *
 * Hojas usadas: PARTIDOS
 */
function obtenerTablaPosiciones(deporteIDD, categoria) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hoja = doc.getSheetByName('PARTIDOS');
    if (!hoja) return [];

    const datos = hoja.getDataRange().getValues();
    const depTarget = String(deporteIDD).trim().toUpperCase();
    const catTarget = String(categoria).trim().toLowerCase();

    // mapa equipo -> stats
    let tabla = {};

    function asegurar(equipo) {
      if (!tabla[equipo]) tabla[equipo] = { equipo: equipo, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
    }

    for (let i = 1; i < datos.length; i++) {
      const dep   = String(datos[i][3]).trim().toUpperCase();
      const cat   = String(datos[i][4]).trim().toLowerCase();
      const est   = String(datos[i][9]).trim().toUpperCase();

      if (dep !== depTarget || cat !== catTarget || est !== 'FINALIZADO') continue;

      const local    = String(datos[i][1]).trim();
      const visita   = String(datos[i][2]).trim();
      const glLocal  = Number(datos[i][7]) || 0;
      const glVisita = Number(datos[i][8]) || 0;

      asegurar(local);
      asegurar(visita);

      // Local
      tabla[local].pj++;
      tabla[local].gf += glLocal;
      tabla[local].gc += glVisita;

      // Visitante
      tabla[visita].pj++;
      tabla[visita].gf += glVisita;
      tabla[visita].gc += glLocal;

      if (glLocal > glVisita) {
        tabla[local].pg++;  tabla[local].pts  += 3;
        tabla[visita].pp++;
      } else if (glLocal < glVisita) {
        tabla[visita].pg++; tabla[visita].pts += 3;
        tabla[local].pp++;
      } else {
        tabla[local].pe++;  tabla[local].pts  += 1;
        tabla[visita].pe++; tabla[visita].pts += 1;
      }
    }

    // Convertir a array y ordenar: pts desc, luego diferencia de goles desc
    return Object.values(tabla).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      return (b.gf - b.gc) - (a.gf - a.gc);
    });

  } catch (e) {
    return [];
  }
}

/**
 * obtenerRankingJugadores(deporteIDD, categoria)
 *
 * Devuelve el ranking de jugadores de una categoría ordenado por goles
 * (mayor a menor), incluyendo goles, asistencias y partidos jugados
 * (cantidad de partidos finalizados en los que fueron convocados).
 *
 * Hojas usadas: PARTIDOS, ESTADISTICAS_PARTIDOS, CONVOCATORIAS, JUGADORES_GENERAL
 */
function obtenerRankingJugadores(deporteIDD, categoria) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const hojaPar  = doc.getSheetByName('PARTIDOS');
    const hojaEst  = doc.getSheetByName('ESTADISTICAS_PARTIDOS');
    const hojaConv = doc.getSheetByName('CONVOCATORIAS');
    const hojaGen  = doc.getSheetByName('JUGADORES_GENERAL');

    if (!hojaPar || !hojaEst || !hojaConv || !hojaGen) return [];

    const datosPar  = hojaPar.getDataRange().getValues();
    const datosEst  = hojaEst.getDataRange().getValues();
    const datosConv = hojaConv.getDataRange().getValues();
    const datosGen  = hojaGen.getDataRange().getValues();

    const depTarget = String(deporteIDD).trim().toUpperCase();
    const catTarget = String(categoria).trim().toLowerCase();

    // 1. IDs de partidos finalizados que matchean deporte+categoría
    let idpSet = {};
    for (let i = 1; i < datosPar.length; i++) {
      const dep = String(datosPar[i][3]).trim().toUpperCase();
      const cat = String(datosPar[i][4]).trim().toLowerCase();
      const est = String(datosPar[i][9]).trim().toUpperCase();
      if (dep === depTarget && cat === catTarget && est === 'FINALIZADO') {
        idpSet[String(datosPar[i][0]).trim()] = true;
      }
    }

    // 2. Mapa de nombres de jugadores
    let nombres = {};
    for (let i = 1; i < datosGen.length; i++) {
      nombres[String(datosGen[i][0]).trim()] = datosGen[i][1] + ' ' + datosGen[i][2];
    }

    // 3. Partidos jugados por jugador (convocado=Si en partidos finalizados)
    let pjPorJugador = {};
    for (let i = 1; i < datosConv.length; i++) {
      const idp     = String(datosConv[i][0]).trim();
      const idj     = String(datosConv[i][1]).trim();
      const convocado = String(datosConv[i][2]).trim().toUpperCase() === 'SI';
      if (idpSet[idp] && convocado) {
        pjPorJugador[idj] = (pjPorJugador[idj] || 0) + 1;
      }
    }

    // 4. Goles y asistencias desde ESTADISTICAS_PARTIDOS
    let stats = {};
    for (let i = 1; i < datosEst.length; i++) {
      const idp      = String(datosEst[i][0]).trim();
      const goleador = String(datosEst[i][1]).trim();
      const asistidor= String(datosEst[i][2]).trim();
      if (!idpSet[idp]) continue;

      if (goleador) {
        if (!stats[goleador]) stats[goleador] = { goles: 0, asistencias: 0 };
        stats[goleador].goles++;
      }
      if (asistidor) {
        if (!stats[asistidor]) stats[asistidor] = { goles: 0, asistencias: 0 };
        stats[asistidor].asistencias++;
      }
    }

    // 5. Unir solo jugadores que participaron al menos en 1 partido convocado
    let ranking = [];
    const idsJugadores = new Set([...Object.keys(pjPorJugador), ...Object.keys(stats)]);

    idsJugadores.forEach(idj => {
      const s = stats[idj] || { goles: 0, asistencias: 0 };
      ranking.push({
        nombre:      nombres[idj] || idj,
        posicion:    '', // no hay posición en la DB actual; dejar vacío
        pj:          pjPorJugador[idj] || 0,
        goles:       s.goles,
        asistencias: s.asistencias
      });
    });

    // Ordenar: goles desc, luego asistencias desc, luego nombre asc
    ranking.sort((a, b) => {
      if (b.goles !== a.goles) return b.goles - a.goles;
      if (b.asistencias !== a.asistencias) return b.asistencias - a.asistencias;
      return a.nombre.localeCompare(b.nombre);
    });

    return ranking;

  } catch (e) {
    return [];
  }
}
