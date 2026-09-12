const MENU_ITEM_LAYOUT_CLASS_NAME =
	'relative grid min-h-[34px] cursor-default select-none grid-cols-[18px_minmax(0,1fr)_auto] items-center rounded-[7px] px-2 py-1.5 text-xs leading-[1.2] font-medium outline-none data-[disabled]:opacity-[0.42]';

export const MENU_ITEM_CLASS_NAME = `${MENU_ITEM_LAYOUT_CLASS_NAME} data-[highlighted]:bg-accent/[0.17] data-[highlighted]:text-white data-[popup-open]:bg-accent/[0.17] data-[popup-open]:text-white`;

export const DESTRUCTIVE_MENU_ITEM_CLASS_NAME = `${MENU_ITEM_LAYOUT_CLASS_NAME} text-[#ff9b9b] data-[highlighted]:bg-[#ff5f5f]/15 data-[highlighted]:text-[#ffb4b4]`;

export const MENU_LABEL_CLASS_NAME = 'ps-[5px] pe-[18px] whitespace-nowrap';

export const MENU_POPUP_CLASS_NAME =
	'box-border min-w-56 rounded-[10px] border border-white/[0.13] bg-panel/[0.98] p-[5px] text-white/[0.88] shadow-[0_18px_45px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.24)] outline-none';

export const MENU_POSITIONER_CLASS_NAME = 'z-[100] outline-none';
