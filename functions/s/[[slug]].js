// Cloudflare Pages Function для обработки /s/:slug
export async function onRequest(context) {
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // pathParts = ['s', 'slug-here']
    const slug = pathParts[1] || '';

    if (!slug) {
        return Response.redirect(url.origin + '/', 302);
    }

    // Редирект на read.html с параметром s=slug
    const redirectUrl = url.origin + '/read.html?s=' + encodeURIComponent(slug);
    return Response.redirect(redirectUrl, 302);
}
