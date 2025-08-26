import { useEffect } from "react";
import Dashboard from "./components/Dashboard";
import { useDashboard } from "./store/useDashboard";

export default function App(){
  const add = useDashboard(s=>s.add);
  const remove = useDashboard(s=>s.remove);
  const setSize = useDashboard(s=>s.setSize);

  useEffect(()=>{
    const addHandler = (e: Event) => {
      const { id, dims } = (e as CustomEvent).detail;
      const base = id === "fake-weather" ? { size:"4x2", w:dims.w, h:dims.h } : { size:"2x2", w:dims.w, h:dims.h };
      add({ widgetId: id, ...base });
    };
    const rmHandler = (e: Event) => remove((e as CustomEvent).detail.id);
    const rsHandler = (e: Event) => {
      const { id, size, dims } = (e as CustomEvent).detail;
      setSize(id, size, dims);
    };
    window.addEventListener('dashboard-add', addHandler as EventListener);
    window.addEventListener('dashboard-remove', rmHandler as EventListener);
    window.addEventListener('dashboard-resize', rsHandler as EventListener);
    return () => {
      window.removeEventListener('dashboard-add', addHandler as EventListener);
      window.removeEventListener('dashboard-remove', rmHandler as EventListener);
      window.removeEventListener('dashboard-resize', rsHandler as EventListener);
    };
  }, [add, remove, setSize]);

  return <Dashboard />;
}
