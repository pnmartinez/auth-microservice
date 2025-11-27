const puppeteer = require('puppeteer');

const ADMIN_PANEL_URL = 'http://localhost:3002';
const FRONTEND_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:3000';

// Credenciales de prueba (el primer usuario registrado será admin)
const TEST_EMAIL = 'verify@example.com';
const TEST_PASSWORD = 'Verify123456';

async function simulateLogin() {
  const headless = process.env.HEADLESS !== 'false';
  console.log(`🚀 Iniciando crawler (headless: ${headless})...\n`);

  const browser = await puppeteer.launch({
    headless: headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Configurar timeouts
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    console.log('📋 Paso 1: Verificando que el admin panel esté disponible...');
    await page.goto(ADMIN_PANEL_URL, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'screenshots/01-admin-panel-loaded.png' });
    console.log('   ✅ Admin panel cargado\n');

    // Verificar que estamos en la página de login
    const pageTitle = await page.title();
    console.log(`   📄 Título de la página: ${pageTitle}`);

    // Esperar a que el formulario de login esté disponible
    console.log('\n📋 Paso 2: Buscando formulario de login...');
    await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 5000 });
    console.log('   ✅ Formulario encontrado\n');

    // Llenar el formulario de login
    console.log('📋 Paso 3: Llenando credenciales...');
    const emailInput = await page.$('input[type="email"]') || await page.$('input[type="text"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (!emailInput || !passwordInput) {
      throw new Error('No se encontraron los campos de email o password');
    }

    // Limpiar campos primero
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(TEST_EMAIL, { delay: 100 });
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(TEST_PASSWORD, { delay: 100 });
    console.log(`   ✅ Email ingresado: ${TEST_EMAIL}`);
    console.log('   ✅ Password ingresado\n');
    await page.screenshot({ path: 'screenshots/02-credentials-filled.png' });
    
    // Interceptar requests de red para debugging
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/auth/login')) {
        const status = response.status();
        console.log(`   🌐 Request a ${url}: Status ${status}`);
        if (status !== 200) {
          try {
            const text = await response.text();
            console.log(`   📄 Response: ${text.substring(0, 200)}\n`);
          } catch (e) {}
        }
      }
    });
    
    // Interceptar errores de consola
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   ⚠️  Console error: ${msg.text()}\n`);
      }
    });

    // Hacer clic en el botón de login
    console.log('📋 Paso 4: Haciendo clic en el botón de login...');
    
    // Buscar el botón de login de diferentes formas
    let loginButton = null;
    try {
      loginButton = await page.$('button[type="submit"]');
    } catch (e) {}
    
    if (!loginButton) {
      try {
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text.toLowerCase().includes('login') || text.toLowerCase().includes('iniciar')) {
            loginButton = btn;
            break;
          }
        }
      } catch (e) {}
    }
    
    if (!loginButton) {
      loginButton = await page.$('button');
    }
    
    if (loginButton) {
      await loginButton.click();
      console.log('   ✅ Botón de login clickeado\n');
      
      // Esperar a que la página cambie o aparezca un mensaje
      console.log('   ⏳ Esperando respuesta del servidor...');
      
      // Esperar a que cambie la URL o aparezca contenido nuevo
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        console.log('   ✅ Navegación detectada\n');
      } catch (e) {
        console.log('   ⚠️  No hubo navegación, esperando cambios en la página...\n');
        await page.waitForTimeout(3000);
      }
      
      await page.screenshot({ path: 'screenshots/03-after-login.png' });

      // Verificar si el login fue exitoso
      const currentUrl = page.url();
      console.log(`   📍 URL actual: ${currentUrl}`);
      
      // Obtener el contenido de la página
      const pageText = await page.evaluate(() => document.body.textContent);
      const pageTitle = await page.title();
      
      console.log(`   📄 Título: ${pageTitle}`);
      
      // Buscar indicadores de éxito
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin')) {
        console.log('   ✅ Login exitoso! Redirigido al dashboard\n');
      } else if (pageText.includes('Dashboard') || pageText.includes('Admin Dashboard') || pageTitle.includes('Dashboard')) {
        console.log('   ✅ Login exitoso! Dashboard detectado en la página\n');
      } else if (pageText.includes('error') || pageText.includes('Error') || pageText.includes('Invalid') || pageText.includes('Failed') || pageText.includes('401') || pageText.includes('403')) {
        console.log('   ⚠️  Error detectado en el login\n');
        const errorText = await page.evaluate(() => {
          const errorEl = document.querySelector('.error, [class*="error"], [id*="error"], [style*="color: red"], div[style*="color: red"]');
          return errorEl ? errorEl.textContent.trim() : 'Error no encontrado en el DOM';
        });
        console.log(`   Mensaje de error: ${errorText}\n`);
        
        // Verificar si hay mensajes en la consola del navegador
        const logs = await page.evaluate(() => {
          return window.console._logs || [];
        });
        if (logs.length > 0) {
          console.log(`   Logs de consola: ${JSON.stringify(logs.slice(-3))}\n`);
        }
      } else {
        console.log('   ⚠️  Estado del login no claro\n');
        console.log(`   Contenido de la página (primeros 300 chars): ${pageText.substring(0, 300)}\n`);
        
        // Verificar mensajes de error específicos
        if (pageText.includes('Login failed') || pageText.includes('failed')) {
          console.log('   ❌ Login falló - "Login failed" detectado\n');
          
          // Intentar obtener el mensaje de error completo
          const errorMsg = await page.evaluate(() => {
            const errorDivs = Array.from(document.querySelectorAll('div')).filter(div => 
              div.textContent.includes('failed') || 
              div.textContent.includes('error') ||
              div.textContent.includes('Error')
            );
            return errorDivs.length > 0 ? errorDivs[0].textContent.trim() : 'Error no encontrado';
          });
          console.log(`   Mensaje completo: ${errorMsg}\n`);
        }
        
        // Verificar si hay elementos del dashboard
        const dashboardElements = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('h1, h2, button, a, div'));
          return elements.map(el => ({
            tag: el.tagName,
            text: el.textContent.trim().substring(0, 50),
            href: el.href || '',
            className: el.className || ''
          })).filter(el => el.text.length > 0).slice(0, 15);
        });
        
        if (dashboardElements.length > 0) {
          console.log('   Elementos encontrados en la página:');
          dashboardElements.forEach((el, i) => {
            console.log(`     ${i + 1}. ${el.tag}${el.className ? `[${el.className}]` : ''}: "${el.text}" ${el.href ? `(${el.href})` : ''}`);
          });
        }
      }
    } else {
      console.log('   ⚠️  Botón de login no encontrado\n');
    }

    // Esperar un poco más para ver el resultado
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/04-final-state.png' });

    // Intentar hacer una acción adicional si estamos en el dashboard
    console.log('📋 Paso 5: Verificando funcionalidades del dashboard...');
    try {
      // Buscar botones o enlaces comunes del dashboard
      const dashboardElements = await page.$$eval('button, a', elements => 
        elements.map(el => ({ text: el.textContent.trim(), tag: el.tagName }))
      );
      
      console.log(`   📊 Elementos encontrados en la página: ${dashboardElements.length}`);
      if (dashboardElements.length > 0) {
        console.log('   Primeros elementos:');
        dashboardElements.slice(0, 5).forEach((el, i) => {
          console.log(`     ${i + 1}. ${el.tag}: "${el.text.substring(0, 50)}"`);
        });
      }
    } catch (error) {
      console.log(`   ⚠️  No se pudieron obtener elementos: ${error.message}`);
    }

    console.log('\n✅ Crawler completado exitosamente!');
    console.log('\n📸 Screenshots guardados en: screenshots/');

  } catch (error) {
    console.error('\n❌ Error durante el crawler:', error.message);
    await page.screenshot({ path: 'screenshots/error.png' });
    throw error;
  } finally {
    if (!headless) {
      console.log('\n⏳ Manteniendo el navegador abierto por 10 segundos para inspección...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    await browser.close();
  }
}

// Función para probar el frontend también
async function testFrontend() {
  const headless = process.env.HEADLESS !== 'false';
  console.log('\n\n🌐 Probando Frontend...\n');

  const browser = await puppeteer.launch({
    headless: headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    console.log('📋 Navegando al frontend...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'screenshots/frontend-01-loaded.png' });
    console.log('   ✅ Frontend cargado\n');

    // Buscar enlace de login o registro
    let loginLink = null;
    try {
      loginLink = await page.$('a[href*="login"]');
    } catch (e) {}
    
    if (!loginLink) {
      const links = await page.$$('a');
      for (const link of links) {
        const text = await page.evaluate(el => el.textContent, link);
        if (text.toLowerCase().includes('login') || text.toLowerCase().includes('iniciar')) {
          loginLink = link;
          break;
        }
      }
    }
    
    if (loginLink) {
      console.log('📋 Haciendo clic en enlace de login...');
      await loginLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/frontend-02-login-page.png' });
      console.log('   ✅ Página de login cargada\n');
    } else {
      console.log('   ⚠️  Enlace de login no encontrado\n');
    }

    await browser.close();
    console.log('✅ Prueba del frontend completada\n');
  } catch (error) {
    console.error('❌ Error probando frontend:', error.message);
    await browser.close();
  }
}

// Ejecutar
(async () => {
  try {
    // Crear directorio de screenshots
    const fs = require('fs');
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }

    await simulateLogin();
    await testFrontend();

    console.log('\n🎉 Todas las pruebas completadas!');
  } catch (error) {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  }
})();

