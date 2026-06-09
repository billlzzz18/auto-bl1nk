import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, Project } from '@/lib/db';
import { getSessionUser, authenticateApiKey } from '@/lib/auth';

/**
 * JSDoc: ค้นหาและสร้างฐานข้อมูลโปรเจกต์ (GET/POST /api/projects)
 * รองรับทั้ง Session Cookies และ Token Bearer API Key สำหรับนักพัฒนา พร้อมระบบแยกข้อมูลขาด (RLS)
 */
export async function GET(req: NextRequest) {
  try {
    let user = await getSessionUser();
    if (!user) {
      const authHeader = req.headers.get('Authorization');
      user = authenticateApiKey(authHeader);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const favOnly = searchParams.get('favorite') === 'true';

    const db = getDb();
    let userProjects = db.projects.filter((p) => p.user_id === user.id);

    if (favOnly) {
      userProjects = userProjects.filter((p) => p.is_favorite);
    }

    // เรียงเวลาจากใหม่ไปเก่า
    userProjects.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ data: userProjects });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let user = await getSessionUser();
    if (!user) {
      const authHeader = req.headers.get('Authorization');
      user = authenticateApiKey(authHeader);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, is_favorite, custom_properties, google_access_token } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อโปรเจกต์' }, { status: 400 });
    }

    let driveFolderId = undefined;
    let driveFolderLink = undefined;

    if (google_access_token) {
      try {
        const driveRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${google_access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `${name}_workspace_folder`,
            mimeType: 'application/vnd.google-apps.folder',
          }),
        });
        if (driveRes.ok) {
          const driveData = await driveRes.json();
          driveFolderId = driveData.id;
          driveFolderLink = `https://drive.google.com/drive/folders/${driveFolderId}`;
        } else {
          console.error('Failed to create Drive folder:', await driveRes.text());
        }
      } catch (err) {
        console.error('Error creating Google Drive folder:', err);
      }
    }

    const db = getDb();
    const projId = 'proj_' + Math.random().toString(36).substr(2, 9);
    
    const newProject: Project = {
      id: projId,
      name,
      description: description || '',
      user_id: user.id,
      is_favorite: !!is_favorite,
      sharing_settings: {
        public_access: false,
        include_subpages: false,
      },
      custom_properties: custom_properties || [],
      created_at: new Date().toISOString(),
      drive_folder_id: driveFolderId,
      drive_folder_link: driveFolderLink,
    };

    db.projects.push(newProject);
    saveDb(db);

    return NextResponse.json({ message: 'สร้างโปรเจกต์เรียบร้อย', data: newProject }, { status: 201 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
