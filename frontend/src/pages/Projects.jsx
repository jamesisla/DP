import React from "react";
import { ClipboardList } from "lucide-react";
import { Panel } from "../components/Panel";
import { Progress } from "../components/Progress";

export function Projects({ projects }) {
  return (
    <div className="p-5 lg:p-8">
      <Panel title="Proyecto de implementacion" icon={ClipboardList}>
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((project) => (
            <div className="item-card" key={project.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{project.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{project.summary}</p>
                </div>
                <span className="status">{project.stage}</span>
              </div>
              <Progress label={`Responsable: ${project.owner}`} value={project.progress} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
