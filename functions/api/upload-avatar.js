// Cloudflare Pages Function для загрузки аватаров
// Использует service_role ключ для обхода RLS

export async function onRequestPost(context) {
    var { request, env } = context;

    // CORS headers
    var headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        // Получаем данные из формы
        var formData = await request.formData();
        var file = formData.get('file');
        var authorId = formData.get('author_id');
        var telegramId = formData.get('telegram_id');

        if (!file || !authorId) {
            return new Response(JSON.stringify({ error: 'Missing file or author_id' }), {
                status: 400,
                headers: headers
            });
        }

        // Проверяем что автор существует и telegram_id совпадает
        var SUPABASE_URL = env.SUPABASE_URL || 'https://xcnvejvkklypvkzkanwj.supabase.co';
        var SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;

        if (!SUPABASE_SERVICE_KEY) {
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: headers
            });
        }

        // Проверяем авторизацию - автор должен существовать с этим telegram_id
        var authorCheck = await fetch(
            SUPABASE_URL + '/rest/v1/authors?id=eq.' + authorId + '&select=id,telegram_id',
            {
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY
                }
            }
        );
        var authors = await authorCheck.json();

        if (!authors || authors.length === 0) {
            return new Response(JSON.stringify({ error: 'Author not found' }), {
                status: 404,
                headers: headers
            });
        }

        // Проверяем telegram_id если передан
        if (telegramId && authors[0].telegram_id !== telegramId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: headers
            });
        }

        // Определяем расширение файла
        var fileName = file.name || 'avatar.jpg';
        var fileExt = fileName.split('.').pop().toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
            fileExt = 'jpg';
        }

        // Путь в storage: {author_id}/avatar.{ext}
        var filePath = authorId + '/avatar.' + fileExt;

        // Загружаем файл в Supabase Storage
        var fileBuffer = await file.arrayBuffer();
        var uploadResponse = await fetch(
            SUPABASE_URL + '/storage/v1/object/avatars/' + filePath,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
                    'Content-Type': file.type || 'image/jpeg',
                    'x-upsert': 'true'
                },
                body: fileBuffer
            }
        );

        if (!uploadResponse.ok) {
            var uploadError = await uploadResponse.text();
            console.error('Upload error:', uploadError);
            return new Response(JSON.stringify({ error: 'Upload failed: ' + uploadError }), {
                status: 500,
                headers: headers
            });
        }

        // Формируем публичный URL
        var avatarUrl = SUPABASE_URL + '/storage/v1/object/public/avatars/' + filePath + '?t=' + Date.now();

        // Обновляем avatar_url в таблице authors
        var updateResponse = await fetch(
            SUPABASE_URL + '/rest/v1/authors?id=eq.' + authorId,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ avatar_url: avatarUrl })
            }
        );

        if (!updateResponse.ok) {
            var updateError = await updateResponse.text();
            return new Response(JSON.stringify({ error: 'Failed to update profile: ' + updateError }), {
                status: 500,
                headers: headers
            });
        }

        return new Response(JSON.stringify({
            success: true,
            avatar_url: avatarUrl
        }), {
            status: 200,
            headers: headers
        });

    } catch (error) {
        console.error('Avatar upload error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: headers
        });
    }
}

// Обработка OPTIONS для CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
