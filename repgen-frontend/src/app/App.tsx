import AuthGate from "../features/auth/AuthGate";
import { ColumnLabelsProvider } from "../features/reports/shared/column-labels/ColumnLabelsProvider";
import AppRouter from "./router";

function App() {
  return (
    <AuthGate>
      {({ tenant, reporteInicio }) => (
        <ColumnLabelsProvider tenant={tenant}>
          <AppRouter reporteInicio={reporteInicio} />
        </ColumnLabelsProvider>
      )}
    </AuthGate>
  );
}

export default App;
