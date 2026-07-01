import type { MetadataRoute } from "next";
import { caseStudies } from "./case-studies/data";
import { blogPosts } from "./blog/data";

const BASE_URL = "https://www.manhattanmintnyc.com";

export default function sitemap(): MetadataRoute.Sitemap {
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: `${BASE_URL}/`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${BASE_URL}/quote/`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${BASE_URL}/pricing-availability/`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${BASE_URL}/case-studies/`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${BASE_URL}/blog/`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.6,
		},
		{
			url: `${BASE_URL}/terms/`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
	];

	const caseStudyPages: MetadataRoute.Sitemap = caseStudies.map((study) => ({
		url: `${BASE_URL}/case-studies/${study.slug}/`,
		lastModified: new Date(study.publishedAt),
		changeFrequency: "monthly",
		priority: 0.6,
	}));

	const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
		url: `${BASE_URL}/blog/${post.slug}/`,
		lastModified: new Date(post.publishedAt),
		changeFrequency: "monthly",
		priority: 0.6,
	}));

	return [...staticPages, ...caseStudyPages, ...blogPages];
}
