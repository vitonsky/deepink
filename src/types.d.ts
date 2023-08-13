declare module "*.sql" {
	const sql: string;
	export default sql;
}

declare module "*.svg" {
	const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
	export default ReactComponent;
}