"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLaborsafe } from "@/hooks/useLaborsafe";
import type { ProcessDocument } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const processSchema = z.object({
  process: z.string().min(1, "El nombre del proceso es requerido."),
  processDescription: z.string().min(1, "La descripción del proceso es requerida."),
  jobPositionsInvolved: z.string().min(1, "Los puestos involucrados son requeridos."),
  taskName: z.string().min(1, "El nombre de la tarea es requerido."),
  taskDescription: z.string().min(1, "La descripción de la tarea es requerida."),
  isRoutine: z.boolean(),
  specificLocation: z.string().min(1, "La ubicación es requerida."),
  numberOfWorkers: z.coerce.number().min(1, "Debe haber al menos un trabajador."),
  sexGenderIdentities: z.string().min(1, "La composición de género es requerida."),
  observations: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  tools: z.string().optional(),
  materials: z.string().optional(),
  environmentalConditions: z.string().optional(),
  requiredTraining: z.string().optional(),
});

interface ProcessFormProps {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  docToEdit?: ProcessDocument | null;
  onClose?: () => void;
}

const getInitialFormValues = (doc: ProcessDocument | null | undefined) => {
  if (doc) {
    return {
      process: doc.process,
      processDescription: doc.processDescription,
      jobPositionsInvolved: doc.jobPositionsInvolved,
      taskName: doc.taskName,
      taskDescription: doc.taskDescription,
      isRoutine: doc.isRoutine,
      specificLocation: doc.specificLocation,
      numberOfWorkers: doc.numberOfWorkers,
      sexGenderIdentities: doc.sexGenderIdentities,
      observations: doc.observations || "",
      frequency: doc.frequency || "",
      duration: doc.duration || "",
      tools: doc.tools || "",
      materials: doc.materials || "",
      environmentalConditions: doc.environmentalConditions || "",
      requiredTraining: doc.requiredTraining || "",
    };
  }
  return {
    process: "",
    processDescription: "",
    jobPositionsInvolved: "",
    taskName: "",
    taskDescription: "",
    isRoutine: true,
    specificLocation: "",
    sexGenderIdentities: "Hombre: 0, Mujer: 0, Trans: 0, No binario: 0",
    observations: "",
    numberOfWorkers: 0,
    frequency: "",
    duration: "",
    tools: "",
    materials: "",
    environmentalConditions: "",
    requiredTraining: "",
  };
};

const testDataSuite = [
  { process: "Soldadura de Estructuras", processDescription: "Proceso de unión de piezas metálicas para la fabricación de vigas y columnas.", jobPositionsInvolved: "Soldador Calificado, Ayudante de soldador", taskName: "Soldadura de arco manual", taskDescription: "Ejecutar soldadura de filete en posición 2F en vigas de acero A36.", isRoutine: true, specificLocation: "Área de maestranza, Nave 2", numberOfWorkers: 3, sexGenderIdentities: "Hombre: 3", observations: "Se requiere ventilación forzada en el área.", frequency: "Diaria", duration: "6-8 horas por turno", tools: "Soldadora de arco, electrodos E6013, máscara de soldar, martillo picador", materials: "Acero A36, electrodos de soldadura, gas argon", environmentalConditions: "Temperatura elevada, humos metálicos, chispas, ruido moderado", requiredTraining: "Certificación en soldadura, uso de EPP, manejo de gases" },
  { process: "Construcción", processDescription: "Fase de obra gruesa de un proyecto de edificación.", jobPositionsInvolved: "Jornalero, Carpintero, Trazador", taskName: "Excavación de zanjas", taskDescription: "Realizar excavación manual para fundaciones según planos.", isRoutine: true, specificLocation: "Sector A de la obra, Eje 1-3", numberOfWorkers: 5, sexGenderIdentities: "Hombre: 4, Mujer: 1", observations: "Terreno presenta alta compactación.", frequency: "Diaria durante fase de fundaciones", duration: "4-6 horas por jornada", tools: "Palas, picotas, carretillas, nivel de burbuja, huincha de medir", materials: "Tierra, ripio, arena, moldajes de madera", environmentalConditions: "Trabajo a la intemperie, polvo, ruido de maquinaria pesada", requiredTraining: "Inducción en obra, uso de EPP, lectura de planos" },
  { process: "Logística y Bodega", processDescription: "Recepción, almacenamiento y despacho de mercadería.", jobPositionsInvolved: "Bodeguero, Operador de grúa horquilla", taskName: "Recepción de mercadería", taskDescription: "Descargar pallets desde camión utilizando grúa horquilla y verificar guía de despacho.", isRoutine: true, specificLocation: "Patio de recepción, andén 3", numberOfWorkers: 2, sexGenderIdentities: "Hombre: 2", observations: "Alto tráfico de vehículos en el patio.", frequency: "Diaria, múltiples veces por turno", duration: "30-45 minutos por camión", tools: "Grúa horquilla, scanner de códigos, tablet, casco, chaleco reflectante", materials: "Pallets de madera, mercadería variada, plástico film", environmentalConditions: "Trabajo al aire libre, gases de escape, ruido de motores", requiredTraining: "Licencia de grúa horquilla, manejo de sistemas WMS, primeros auxilios" },
  { process: "Administrativo", processDescription: "Labores de oficina y gestión documental.", jobPositionsInvolved: "Asistente Administrativo, Analista Contable", taskName: "Digitación de facturas", taskDescription: "Ingresar datos de facturas de proveedores en el sistema ERP.", isRoutine: true, specificLocation: "Oficina de Administración, piso 2", numberOfWorkers: 4, sexGenderIdentities: "Mujer: 3, Hombre: 1", observations: "Trabajo prolongado frente a pantalla.", frequency: "Diaria", duration: "6-8 horas continuas", tools: "Computador, teclado ergonómico, mouse, escáner, calculadora", materials: "Papel, tinta de impresora, archivadores, facturas físicas", environmentalConditions: "Oficina climatizada, iluminación artificial, ruido de equipos", requiredTraining: "Manejo de sistema ERP, Excel avanzado, normativa tributaria" },
  { process: "Aseo Industrial", processDescription: "Limpieza y desinfección de áreas comunes y productivas.", jobPositionsInvolved: "Auxiliar de Aseo", taskName: "Limpieza de planta productiva", taskDescription: "Utilizar máquina lavadora de pisos para limpiar pasillos de la planta.", isRoutine: true, specificLocation: "Planta de producción", numberOfWorkers: 2, sexGenderIdentities: "Mujer: 2", observations: "Piso puede estar resbaladizo. Se usan químicos de limpieza.", frequency: "Diaria, 2 veces por turno", duration: "2-3 horas por sesión", tools: "Máquina lavadora de pisos, mopa industrial, baldes, aspiradora", materials: "Detergente industrial, desinfectante, agua, trapos de microfibra", environmentalConditions: "Humedad, vapores químicos, pisos mojados, ruido de maquinaria", requiredTraining: "Manejo seguro de químicos, uso de EPP, técnicas de limpieza" },
  { process: "Transporte de Carga", processDescription: "Traslado de productos entre sucursales.", jobPositionsInvolved: "Conductor de Camión", taskName: "Conducción en ruta", taskDescription: "Conducir camión de carga por carretera entre Santiago y Valparaíso.", isRoutine: true, specificLocation: "Ruta 68", numberOfWorkers: 1, sexGenderIdentities: "Hombre: 1", observations: "Exposición a condiciones de tráfico y climáticas variables.", frequency: "Diaria, 2-3 viajes por día", duration: "3-4 horas por viaje", tools: "Camión, GPS, radio comunicador, linterna, herramientas básicas", materials: "Combustible diesel, aceite de motor, cadenas para nieve", environmentalConditions: "Variaciones climáticas, tráfico intenso, gases de escape", requiredTraining: "Licencia clase A3, curso de conducción defensiva, primeros auxilios" },
  { process: "Atención de Salud Primaria", processDescription: "Consulta médica general a pacientes ambulatorios.", jobPositionsInvolved: "Médico General, TENS", taskName: "Atención de paciente en consulta", taskDescription: "Realizar anamnesis, examen físico y entregar indicaciones a paciente.", isRoutine: true, specificLocation: "Box de atención N° 5, CESFAM", numberOfWorkers: 2, sexGenderIdentities: "Mujer: 1, Hombre: 1", observations: "Posible contacto con pacientes con enfermedades infecciosas.", frequency: "Diaria, 20-25 pacientes por turno", duration: "15-20 minutos por consulta", tools: "Estetoscopio, tensiómetro, otoscopio, computador, termometro", materials: "Guantes de látex, mascarillas, alcohol gel, recetas médicas", environmentalConditions: "Ambiente cerrado, contacto con fluidos corporales, estrés emocional", requiredTraining: "Título profesional, RCP, manejo de residuos hospitalarios" },
  { process: "Cocina Industrial", processDescription: "Preparación masiva de alimentos para casino.", jobPositionsInvolved: "Maestro de Cocina, Ayudante de Cocina", taskName: "Corte de vegetales", taskDescription: "Cortar verduras en grandes cantidades utilizando cuchillo y tabla de cortar.", isRoutine: true, specificLocation: "Área de cocina fría", numberOfWorkers: 3, sexGenderIdentities: "Mujer: 2, Hombre: 1", observations: "Movimientos repetitivos y uso de elementos cortopunzantes.", frequency: "Diaria, preparación para 3 servicios", duration: "4-5 horas por turno", tools: "Cuchillos profesionales, tablas de corte, mandolina, procesadora", materials: "Verduras frescas, frutas, carnes, aceites, condimentos", environmentalConditions: "Humedad, temperatura fría, pisos húmedos, ruido de equipos", requiredTraining: "Manipulación de alimentos, HACCP, uso seguro de cuchillos" },
  { process: "Retail y Ventas", processDescription: "Atención a clientes y venta de productos en tienda.", jobPositionsInvolved: "Vendedor, Cajero", taskName: "Atención a público en mesón", taskDescription: "Responder consultas, mostrar productos y gestionar ventas de clientes en el mesón de atención.", isRoutine: true, specificLocation: "Tienda principal, área de ventas", numberOfWorkers: 4, sexGenderIdentities: "Mujer: 3, No binario: 1", observations: "Interacción constante con público, a veces bajo presión.", frequency: "Diaria, horario comercial", duration: "8 horas con descansos", tools: "Caja registradora, lector de códigos, terminal de pago, teléfono", materials: "Bolsas, papel de regalo, etiquetas, catálogos de productos", environmentalConditions: "Iluminación artificial, música ambiental, flujo constante de personas", requiredTraining: "Atención al cliente, manejo de caja, conocimiento de productos" },
  { process: "Mantenimiento Eléctrico", processDescription: "Revisión y reparación de sistemas eléctricos de la planta.", jobPositionsInvolved: "Eléctrico de Mantenimiento", taskName: "Revisión de tablero eléctrico", taskDescription: "Medir voltajes y corrientes en tablero general de fuerza, con equipo energizado.", isRoutine: false, specificLocation: "Sala eléctrica principal", numberOfWorkers: 2, sexGenderIdentities: "Hombre: 2", observations: "Trabajo en tensión, requiere bloqueo de energías y uso de EPP dieléctrico.", frequency: "Semanal, mantenimiento preventivo", duration: "2-3 horas por revisión", tools: "Multímetro, pinza amperimétrica, destornilladores aislados, linterna", materials: "Repuestos eléctricos, cables, conectores, etiquetas de identificación", environmentalConditions: "Riesgo eléctrico, espacios confinados, calor por equipos", requiredTraining: "Técnico eléctrico, trabajo en tensión, primeros auxilios eléctricos" },
  { process: "Minería Subterránea", processDescription: "Extracción de mineral en mina subterránea.", jobPositionsInvolved: "Perforista, Tronador, Operador de LHD", taskName: "Perforación de frente", taskDescription: "Perforar barrenos en frente de avance utilizando jumbo electrohidráulico.", isRoutine: true, specificLocation: "Nivel 850, Galería Norte", numberOfWorkers: 3, sexGenderIdentities: "Hombre: 3", observations: "Ambiente con polvo, ruido intenso y riesgo de derrumbe.", frequency: "Diaria por turnos", duration: "8 horas por turno", tools: "Jumbo electrohidráulico, brocas, mangueras, lámpara minera", materials: "Explosivos, detonadores, agua para perforación, aceite hidráulico", environmentalConditions: "Polvo de sílice, ruido >85dB, vibraciones, espacios confinados", requiredTraining: "Curso de perforación, manejo de explosivos, rescate minero" },
  { process: "Agricultura", processDescription: "Cultivo y cosecha de productos agrícolas.", jobPositionsInvolved: "Temporero, Supervisor de Campo", taskName: "Cosecha de uva", taskDescription: "Cortar racimos de uva manualmente y depositar en bins de cosecha.", isRoutine: true, specificLocation: "Cuartel 15, Viña Santa Rita", numberOfWorkers: 12, sexGenderIdentities: "Mujer: 7, Hombre: 5", observations: "Trabajo bajo sol, posturas forzadas y movimientos repetitivos.", frequency: "Estacional, marzo-abril", duration: "10-12 horas por jornada", tools: "Tijeras de podar, bins plásticos, escaleras, canastos", materials: "Uvas, bolsas plásticas, etiquetas de identificación", environmentalConditions: "Radiación UV, calor extremo, polvo, insectos", requiredTraining: "Técnicas de cosecha, uso de EPP, primeros auxilios" },
  { process: "Pesca Industrial", processDescription: "Captura y procesamiento de productos del mar.", jobPositionsInvolved: "Pescador, Motorista, Patrón de Pesca", taskName: "Lanzado de redes", taskDescription: "Desplegar redes de cerco para captura de anchoveta desde embarcación.", isRoutine: true, specificLocation: "Zona de pesca, 15 millas náuticas", numberOfWorkers: 8, sexGenderIdentities: "Hombre: 8", observations: "Trabajo en mar, riesgo de caída al agua y condiciones climáticas adversas.", frequency: "Diaria durante temporada", duration: "12-16 horas por faena", tools: "Redes de cerco, winches, sonar, GPS, radio VHF", materials: "Combustible, hielo, sal, cajas de pescado", environmentalConditions: "Oleaje, viento, frío, humedad, gases de motor", requiredTraining: "Navegación, supervivencia en mar, primeros auxilios" },
  { process: "Educación", processDescription: "Enseñanza en establecimiento educacional.", jobPositionsInvolved: "Profesor de Aula, Asistente de la Educación", taskName: "Dictado de clases", taskDescription: "Realizar clase de matemáticas a estudiantes de 7° básico.", isRoutine: true, specificLocation: "Sala 12, Escuela Básica Los Aromos", numberOfWorkers: 2, sexGenderIdentities: "Mujer: 2", observations: "Exposición a ruido de estudiantes y estrés por manejo de grupo.", frequency: "Diaria, 6 horas pedagógicas", duration: "45 minutos por clase", tools: "Pizarra, proyector, computador, calculadora, material didáctico", materials: "Tiza, marcadores, papel, libros de texto, fotocopias", environmentalConditions: "Ruido de estudiantes, polvo de tiza, estrés vocal", requiredTraining: "Título pedagógico, manejo de grupo, primeros auxilios" },
  { process: "Silvicultura", processDescription: "Manejo y explotación de bosques plantados.", jobPositionsInvolved: "Motosierrista, Choker", taskName: "Volteo de árboles", taskDescription: "Cortar pinos de 20 años utilizando motosierra en pendiente pronunciada.", isRoutine: true, specificLocation: "Rodal 45, Fundo El Roble", numberOfWorkers: 4, sexGenderIdentities: "Hombre: 4", observations: "Terreno irregular, riesgo de caída de árboles y uso de herramientas cortantes.", frequency: "Diaria durante temporada", duration: "8 horas con descansos", tools: "Motosierra, hacha, cuñas, casco forestal, radio comunicador", materials: "Combustible, aceite de cadena, repuestos de motosierra", environmentalConditions: "Pendientes pronunciadas, ramas caídas, ruido >100dB", requiredTraining: "Manejo de motosierra, técnicas de volteo, primeros auxilios" },
  { process: "Química Industrial", processDescription: "Producción de productos químicos básicos.", jobPositionsInvolved: "Operador de Planta, Supervisor de Turno", taskName: "Control de reactor", taskDescription: "Monitorear parámetros de temperatura y presión en reactor de síntesis.", isRoutine: true, specificLocation: "Planta de Amoniaco, Sala de Control", numberOfWorkers: 3, sexGenderIdentities: "Hombre: 2, Mujer: 1", observations: "Exposición a vapores químicos y riesgo de explosión.", frequency: "Continua, 24/7 por turnos", duration: "12 horas por turno", tools: "Computador de control, medidores, válvulas, teléfono de emergencia", materials: "Amoniaco, hidrógeno, nitrógeno, catalizadores", environmentalConditions: "Vapores tóxicos, alta presión, temperatura elevada", requiredTraining: "Procesos químicos, emergencias, uso de equipos de protección" },
  { process: "Textil", processDescription: "Confección de prendas de vestir.", jobPositionsInvolved: "Costurera, Cortador, Supervisor de Línea", taskName: "Costura de prendas", taskDescription: "Coser pantalones de mezclilla utilizando máquina overlock industrial.", isRoutine: true, specificLocation: "Línea de producción 3", numberOfWorkers: 15, sexGenderIdentities: "Mujer: 12, Hombre: 3", observations: "Movimientos repetitivos, postura sedente prolongada y ruido de máquinas.", frequency: "Diaria, producción continua", duration: "8 horas con pausas", tools: "Máquina overlock, tijeras, alfileres, plancha industrial", materials: "Tela de mezclilla, hilos, botones, cierres, etiquetas", environmentalConditions: "Ruido de máquinas, pelusa textil, calor de planchas", requiredTraining: "Operación de máquinas, control de calidad, ergonomia" },
  { process: "Telecomunicaciones", processDescription: "Instalación y mantención de redes de telecomunicaciones.", jobPositionsInvolved: "Técnico en Telecomunicaciones, Ayudante", taskName: "Instalación de fibra óptica", taskDescription: "Tender cable de fibra óptica en poste de 12 metros de altura.", isRoutine: true, specificLocation: "Av. Providencia con Los Leones", numberOfWorkers: 2, sexGenderIdentities: "Hombre: 2", observations: "Trabajo en altura, riesgo eléctrico y exposición a tráfico vehicular.", frequency: "Diaria según demanda", duration: "4-6 horas por instalación", tools: "Escalera, arnés, fusionadora, medidor de potencia, herramientas", materials: "Cable de fibra óptica, conectores, manga de empalme", environmentalConditions: "Altura, líneas eléctricas, tráfico, condiciones climáticas", requiredTraining: "Trabajo en altura, fibra óptica, riesgos eléctricos" },
  { process: "Hotelería", processDescription: "Servicios de hospedaje y atención a huéspedes.", jobPositionsInvolved: "Recepcionista, Botones, Mucama", taskName: "Aseo de habitaciones", taskDescription: "Limpiar y ordenar habitaciones de hotel, cambiar ropa de cama.", isRoutine: true, specificLocation: "Piso 8, Hotel Plaza", numberOfWorkers: 6, sexGenderIdentities: "Mujer: 5, Hombre: 1", observations: "Manipulación de químicos de limpieza y posturas forzadas.", frequency: "Diaria, 12-15 habitaciones por turno", duration: "30-45 minutos por habitación", tools: "Aspiradora, carro de limpieza, trapos, escobas, guantes", materials: "Detergentes, desinfectantes, sábanas, toallas, amenities", environmentalConditions: "Vapores químicos, posturas incómodas, carga física", requiredTraining: "Técnicas de limpieza, manejo de químicos, atención al cliente" },
  { process: "Seguridad Privada", processDescription: "Vigilancia y protección de instalaciones.", jobPositionsInvolved: "Guardia de Seguridad", taskName: "Ronda de vigilancia nocturna", taskDescription: "Realizar recorrido de seguridad en instalaciones industriales durante turno nocturno.", isRoutine: true, specificLocation: "Planta Industrial, perímetro completo", numberOfWorkers: 2, sexGenderIdentities: "Hombre: 2", observations: "Trabajo nocturno, caminata prolongada y riesgo de agresión.", frequency: "Cada 2 horas durante turno nocturno", duration: "45 minutos por ronda", tools: "Linterna, radio, reloj control, silbato, teléfono móvil", materials: "Baterías, formularios de registro, llaves maestras", environmentalConditions: "Oscuridad, frío nocturno, ruidos extraños, soledad", requiredTraining: "Curso OS-10, primeros auxilios, manejo de conflictos" },
];

export default function ProcessForm({ isOpen, setIsOpen, docToEdit, onClose }: ProcessFormProps) {
  const { addProcessDocument, updateProcessDocument, activeProcessDocuments } = useLaborsafe();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof processSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(processSchema) as any,
    defaultValues: getInitialFormValues(docToEdit),
  });

  useEffect(() => {
    form.reset(getInitialFormValues(docToEdit));
  }, [docToEdit, form, isOpen]);

  function onSubmit(values: z.infer<typeof processSchema>) {
    if (docToEdit) {
      updateProcessDocument({ ...values, id: docToEdit.id, companyId: docToEdit.companyId });
    } else {
      addProcessDocument(values);
      form.reset(getInitialFormValues(null));
    }
    handleClose();
  }

  const handleClose = () => {
    if (setIsOpen) {
      form.reset(getInitialFormValues(null));
      setIsOpen(false);
    }
    if (onClose) onClose();
  };

  const populateWithTestData = () => {
    const existingProcessNames = new Set(activeProcessDocuments.map(doc => doc.process));
    const nextTestData = testDataSuite.find(data => !existingProcessNames.has(data.process));

    if (nextTestData) {
      addProcessDocument(nextTestData);
      toast({ title: "Dato de prueba añadido", description: `Se ha añadido el proceso "${nextTestData.process}".` });
    } else {
      toast({ title: "No hay más datos de prueba", description: "Ya se han añadido todos los ejemplos disponibles." });
    }
    form.reset(getInitialFormValues(null));
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="process" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del Proceso</FormLabel>
            <FormControl><Input placeholder="Ej: Mantención de equipos" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="processDescription" render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción del Proceso</FormLabel>
            <FormControl><Textarea placeholder="Describa brevemente el proceso..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="jobPositionsInvolved" render={({ field }) => (
          <FormItem>
            <FormLabel>Puestos Involucrados</FormLabel>
            <FormControl><Input placeholder="Ej: Mecánico, Supervisor" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="taskName" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre de la Tarea</FormLabel>
            <FormControl><Input placeholder="Ej: Cambio de aceite" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="taskDescription" render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción de la Tarea</FormLabel>
            <FormControl><Textarea placeholder="Describa los pasos principales de la tarea..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="specificLocation" render={({ field }) => (
            <FormItem>
              <FormLabel>Lugar Específico</FormLabel>
              <FormControl><Input placeholder="Ej: Taller de mantención" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="numberOfWorkers" render={({ field }) => (
            <FormItem>
              <FormLabel>N° Total de Trabajadores</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="sexGenderIdentities" render={({ field }) => (
          <FormItem>
            <FormLabel>Composición por Género</FormLabel>
            <FormControl><Input placeholder="Ej: Hombres: 2, Mujeres: 1" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="frequency" render={({ field }) => (
            <FormItem>
              <FormLabel>Frecuencia</FormLabel>
              <FormControl><Input placeholder="Ej: Diaria, Semanal" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="duration" render={({ field }) => (
            <FormItem>
              <FormLabel>Duración</FormLabel>
              <FormControl><Input placeholder="Ej: 2 horas, Todo el turno" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="tools" render={({ field }) => (
          <FormItem>
            <FormLabel>Herramientas y Equipos</FormLabel>
            <FormControl><Textarea placeholder="Ej: Taladro, Soldadora, Computador..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="materials" render={({ field }) => (
          <FormItem>
            <FormLabel>Materiales y Sustancias</FormLabel>
            <FormControl><Textarea placeholder="Ej: Acero, Químicos de limpieza..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="environmentalConditions" render={({ field }) => (
          <FormItem>
            <FormLabel>Condiciones Ambientales</FormLabel>
            <FormControl><Textarea placeholder="Ej: Temperatura elevada, Ruido, Polvo..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="requiredTraining" render={({ field }) => (
          <FormItem>
            <FormLabel>Capacitación Requerida</FormLabel>
            <FormControl><Textarea placeholder="Ej: Curso de soldadura, Manejo de grúa..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="observations" render={({ field }) => (
          <FormItem>
            <FormLabel>Observaciones</FormLabel>
            <FormControl><Textarea placeholder="Añadir cualquier observación relevante..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="isRoutine" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>¿Es una tarea rutinaria?</FormLabel>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )} />
        <div className="flex justify-between items-center pt-4">
          <Button type="button" variant="outline" onClick={populateWithTestData}>
            Añadir datos de prueba
          </Button>
          <div>
            {isOpen !== undefined ? (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button type="submit">Guardar Cambios</Button>
              </DialogFooter>
            ) : (
              <Button type="submit">{docToEdit ? 'Guardar Cambios' : 'Añadir Proceso'}</Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );

  if (isOpen !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{docToEdit ? "Editar Proceso" : "Añadir Nuevo Proceso"}</DialogTitle>
            <DialogDescription>Complete los detalles del proceso y la tarea a continuación.</DialogDescription>
          </DialogHeader>
          <div className="py-4">{formContent}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return formContent;
}
