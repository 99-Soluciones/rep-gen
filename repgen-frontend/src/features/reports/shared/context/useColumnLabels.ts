import { use } from "react";
import { ColumnLabelsContext } from "./column-labels.context";

export const useColumnLabels = () => {
  const context = use(ColumnLabelsContext);
  if (!context) {
    throw new Error("useColumnLabels debe usarse dentro de ColumnLabelsProvider");
  }
  return context;
};
