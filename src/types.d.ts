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

// TODO: remove once https://github.com/jonschlinkert/intl-segmenter/pull/2 will be merged
declare module "intl-segmenter" {
	declare class Segmenter extends Intl.Segmenter {
		private readonly language;
		private readonly options;
		constructor(language: string, options?: Intl.SegmenterOptions & {
			maxChunkLength?: number;
		});
		segment(input: string): Intl.Segments;
		findSafeBreakPoint(input: string): number;
		getSegments(input: string): Intl.SegmentData[];
		static getSegments(input: string, language: string, options?: Intl.SegmenterOptions): Intl.SegmentData[];
	}

	export { Segmenter };
}