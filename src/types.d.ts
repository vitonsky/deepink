declare module "*.sql" {
	const sql: string;
	export default sql;
}

declare module "*.module.css" {
	const css: Record<string, string>;
	export default css;
}

declare module "*.svg" {
	const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
	export default ReactComponent;
}