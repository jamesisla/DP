import React, { useState } from "react";
import { 
  Database, 
  ShieldAlert, 
  Lock, 
  EyeOff, 
  Server, 
  Key, 
  Activity,
  Layers,
  ChevronDown,
  Info,
  ServerCrash
} from "lucide-react";
import { Panel } from "../components/Panel";

export function OracleMissions() {
  const [selectedTask, setSelectedTask] = useState(null);

  const dbTasks = [
    {
      id: "TASK-01",
      name: "Cifrado de Datos en Reposo (Encryption at Rest)",
      impact: "Almacenamiento Físico de BD, Respaldos (Backups) y Medios de Exportación",
      category: "Seguridad Física y Almacenamiento",
      oracleProduct: "Oracle Advanced Security (Transparent Data Encryption - TDE)",
      problem: "Acceso no autorizado directo a los archivos físicos de datos (.dbf), robo de discos duros de servidores de BD o sustracción no autorizada de backups físicos de la institución.",
      solution: "Cifra de forma totalmente transparente e inalterable las tablas, columnas sensibles o tablespaces enteros directamente en el disco. Impide que un usuario acceda a los datos legibles a través del sistema operativo, robando archivos físicos o cintas de copia de respaldo, sin penalizar el rendimiento ni requerir cambios en el código de las aplicaciones.",
      severity: "Crítica"
    },
    {
      id: "TASK-02",
      name: "Enmascaramiento y Anonimización de Ambientes de Prueba",
      impact: "Entornos no productivos (Desarrollo, QA, Testing, UAT y Terceros externos)",
      category: "Privacidad y Desarrollo Seguro",
      oracleProduct: "Oracle Data Masking and Subsetting",
      problem: "Exposición masiva de datos personales reales de ciudadanos y funcionarios (ej. RUTs, correos, remuneraciones, salud) ante desarrolladores internos, analistas de QA o proveedores externos que realizan pruebas en ambientes no productivos.",
      solution: "Reemplaza los datos personales confidenciales con valores ficticios pero sintácticamente idénticos y realistas. Mantiene la estructura, tipo de datos e integridad referencial de la base de datos de manera irreversible, garantizando ambientes de desarrollo seguros y en pleno cumplimiento normativo.",
      severity: "Alta"
    },
    {
      id: "TASK-03",
      name: "Control de Acceso de Usuarios Privilegiados y DBAs",
      impact: "Esquemas de Aplicación, Control de Operaciones y Privilegios del DBA",
      category: "Control de Acceso",
      oracleProduct: "Oracle Database Vault",
      problem: "Administradores de Bases de Datos (DBAs) o usuarios con altos privilegios del sistema (ej. SYS, SYSTEM) que, al tener control técnico total, pueden inspeccionar tablas de negocio con datos personales altamente confidenciales (ej. datos de salud, fichas médicas, auditorías) sin una justificación de negocio válida.",
      solution: "Implementa una separación estricta de funciones. Bloquea el acceso de usuarios altamente privilegiados (DBAs de infraestructura o administradores) a los datos sensibles de negocio, permitiéndoles mantener la BD activa pero sin ver ni modificar el contenido confidencial de las aplicaciones. Controla el acceso basado en factores contextuales (IP, horario, herramienta de acceso).",
      severity: "Crítica"
    },
    {
      id: "TASK-04",
      name: "Trazabilidad, Auditoría y Firewall de Transacciones SQL",
      impact: "Registros de Auditoría (Logs de Seguridad), Pistas de Actividad e Interfaces API",
      category: "Monitorización y Trazabilidad",
      oracleProduct: "Oracle Audit Vault and Database Firewall (AVDF)",
      problem: "Ausencia de logs unificados e inalterables de modificaciones en la base de datos, imposibilidad de detectar inyecciones SQL sospechosas en tiempo real, o el riesgo de que un administrador con privilegios manipule o elimine los registros de auditoría locales para borrar su rastro.",
      solution: "Recopila y consolida registros de auditoría de múltiples sistemas de bases de datos en un almacén seguro, inalterable y fortificado fuera del servidor. Además, actúa como un Firewall de red que inspecciona el tráfico de sentencias SQL entrantes para bloquear accesos inusuales o denegar solicitudes de inyección SQL antes de que lleguen a la BD.",
      severity: "Alta"
    },
    {
      id: "TASK-05",
      name: "Custodia y Gestión Centralizada de Claves Criptográficas",
      impact: "Monederos de Software (Wallets), Claves de Cifrado, Certificados SSL/TLS",
      category: "Criptografía y Llaves",
      oracleProduct: "Oracle Key Vault",
      problem: "Gestión insegura, dispersa o expuesta de las llaves de cifrado en discos locales de múltiples servidores, lo cual pone en riesgo la seguridad de las llaves y dificulta el cumplimiento de políticas de rotación de claves criptográficas.",
      solution: "Proporciona un almacenamiento seguro y centralizado mediante appliances virtuales fortificados para la administración del ciclo de vida de claves criptográficas, monederos (wallets de Oracle), archivos de contraseñas y certificados Java, facilitando la auditoría de uso de llaves.",
      severity: "Media"
    }
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Executive Header */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
            <Database size={24} />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">Aseguramiento de Datos Corporativos</span>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">Tareas Técnicas de Base de Datos y Oracle Roadmap</h2>
            <p className="text-xs text-slate-400 mt-0.5">Guía de cumplimiento técnico para infraestructura de datos y bases de datos relacionales.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
            Arquitectura Segura
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        
        {/* Task lists panel */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Layers className="text-slate-400" size={16} />
            Tareas Críticas del DBA y Seguridad
          </h3>

          <div className="space-y-3">
            {dbTasks.map((task, idx) => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                  selectedTask?.id === task.id
                    ? "bg-teal-50/40 border-teal-500 shadow-sm"
                    : "bg-white border-line hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">{task.id}</span>
                    <h4 className="font-bold text-slate-800 text-xs leading-relaxed">{task.name}</h4>
                  </div>
                  
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black border ${
                    task.severity === "Crítica" 
                      ? "bg-rose-50 text-rose-700 border-rose-200" 
                      : task.severity === "Alta" 
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {task.severity}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold border-t border-slate-50 pt-2.5">
                  <Server size={11} />
                  <span className="truncate">Impacto: {task.impact}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Product Recommendations & details panel */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Lock className="text-teal-600" size={16} />
            Tecnología Recomendada (Oracle Solution)
          </h3>

          {selectedTask ? (
            <div className="rounded-xl border border-line bg-white p-6 shadow-sm space-y-6 animate-fadeIn">
              
              {/* Product title and badge */}
              <div className="pb-4 border-b border-slate-100">
                <span className="text-[9px] bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Oracle Security Suite
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-2 flex items-center gap-2">
                  <Database size={20} className="text-teal-600" />
                  {selectedTask.oracleProduct}
                </h3>
                <p className="text-[11px] font-medium text-slate-400 mt-1 bg-slate-50 border border-slate-100 p-2 rounded">
                  <strong>Tarea Relacionada:</strong> {selectedTask.name}
                </p>
              </div>

              {/* Problem Statement */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                  <ShieldAlert className="text-rose-500" size={15} />
                  Problema Genérico que Resuelve
                </h4>
                <p className="text-xs text-slate-600 bg-rose-50/10 border border-rose-100/50 p-4 rounded-lg leading-relaxed font-medium">
                  {selectedTask.problem}
                </p>
              </div>

              {/* Solution Overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                  <Activity className="text-teal-600" size={15} />
                  Cómo lo Resuelve (Solución Tecnológica)
                </h4>
                <p className="text-xs text-slate-600 bg-teal-50/5 border border-teal-100/30 p-4 rounded-lg leading-relaxed">
                  {selectedTask.solution}
                </p>
              </div>

              {/* Deployment Scope */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5 flex items-start gap-2.5">
                <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  <strong>Ámbito de Impacto Normativo:</strong> Esta recomendación cubre brechas críticas del ciclo de vida del dato personal exigibles por la Ley 21.719 en lo referente al resguardo técnico, trazabilidad de logs administrativos y minimización del riesgo de fugas accidentales o maliciosas.
                </div>
              </div>

            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-350 p-12 text-center text-slate-400 bg-white h-72 flex flex-col items-center justify-center">
              <Database size={40} className="mb-3 opacity-40 text-slate-500" />
              <p className="font-semibold text-xs">Selecciona una tarea de la lista</p>
              <p className="text-[10px] mt-1 text-slate-400 max-w-xs mx-auto">
                Haz clic en cualquiera de las tareas de base de datos a la izquierda para inspeccionar el diagnóstico Oracle y su forma de mitigación técnica.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
