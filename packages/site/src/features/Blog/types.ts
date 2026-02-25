export type BlogPostData = {
	slug: string;
	data: {
		title: string;
		description?: string;
		date: Date;
		image?: {
			src: string;
			width: number;
			height: number;
			format: string;
		};
	};
};
