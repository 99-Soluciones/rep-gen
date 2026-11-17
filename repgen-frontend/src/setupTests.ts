import '@testing-library/jest-dom';

// jsdom oculta todo [popover] y no implementa showPopover. Los paneles se
// montan solo mientras están abiertos (shared/utils/usePopoverAnclado.ts): visibles.
const estiloPopover = document.createElement('style');
estiloPopover.textContent = '[popover] { display: block !important; }';
document.head.append(estiloPopover);
