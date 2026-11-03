import { test, expect } from '@playwright/test';

// Helper to fill all required particulars for scholarship form
async function fillScholarshipRequiredFields(page: any) {
  await page.locator('#field-father_name').fill('Ramakant Vishwakarma');
  await page.locator('#field-mother_name').fill('Shanti Devi');
  await page.locator('#field-category_caste').fill('OBC');
  await page.locator('#field-institution_name').fill('Govt Engineering College');
  await page.locator('#field-course_and_year').fill('B.Tech 3rd Year');
  await page.locator('#field-annual_income').fill('150000');
  await page.locator('#field-academic_record').fill('82% in previous semester');
  await page.locator('#field-recipient_title').fill('District Welfare Officer');
  await page.locator('#field-department_or_office').fill('Minorities Welfare Department');
  await page.locator('#field-scheme_name').fill('Post-Matric State Scholarship');
}

test.describe('Form Format, Checklist & Enclosure Documents Suite', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock NextAuth Session
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'usr_test_123', name: 'Raj Vishwakarma', email: 'raj@example.com' },
          expires: '2099-01-01T00:00:00.000Z',
        }),
      });
    });

    // 2. Mock User Profile with prefill data
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'PUT') {
        const payload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, updated: payload }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'prof_123',
            user_id: 'usr_test_123',
            full_name: 'Raj Vishwakarma',
            phone: '9876543210',
            email: 'raj@example.com',
            address: '123 MG Road',
            city: 'Bhopal',
            state: 'Madhya Pradesh',
            pincode: '462001',
            father_name: '',
            date_of_birth: '2000-01-15',
            preferred_language: 'en',
          }),
        });
      }
    });

    // 3. Mock Documents Vault
    await page.route('**/api/documents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          documents: [
            { id: 'doc-vault-1', file_name: 'Aadhaar_Card_Raj.pdf', file_type: 'application/pdf', file_size: 450 * 1024 },
            { id: 'doc-vault-2', file_name: 'Class_10_Marksheet.pdf', file_type: 'application/pdf', file_size: 600 * 1024 },
          ],
        }),
      });
    });

    // 4. Mock Document Generation endpoint
    await page.route('**/api/forms/generate-doc', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: body.prompt || 'Generated Application',
          sections: {
            header: 'To,\nThe Principal,\nGovt. Engineering College,\nBhopal (M.P.)',
            date: '31/10/2026',
            subject: 'Application for Form Submission',
            salutation: 'Respected Sir,',
            body: 'I respectfully submit this formal application with all requested particulars.',
            closing: 'Yours faithfully,',
            signature: 'Raj Vishwakarma\nStudent ID: 42',
            enclosures: ['1. Passport Size Photo', '2. Marksheet'],
          },
          charCount: 350,
          wordCount: 55,
        }),
      });
    });

    // 5. Mock Package Generation endpoint
    await page.route('**/api/forms/package', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 Mock Merged Package PDF Content'),
      });
    });
  });

  // Test 1: A leave application shows its required fields and no document step
  test('A leave application shows its required fields and no document step', async ({ page }) => {
    await page.goto('/forms/new');

    // Select Leave Application template
    const leaveCard = page.locator('[data-testid="template-leave_application"]');
    await expect(leaveCard).toBeVisible();
    await leaveCard.click();

    // Verify step 2 checklist particulars are visible
    await expect(page.locator('#field-applicant_name')).toBeVisible();
    await expect(page.locator('#field-designation_or_roll')).toBeVisible();
    await expect(page.locator('#field-organization_name')).toBeVisible();
    await expect(page.locator('#field-recipient_title')).toBeVisible();
    await expect(page.locator('#field-leave_type')).toBeVisible();
    await expect(page.locator('#field-start_date')).toBeVisible();
    await expect(page.locator('#field-end_date')).toBeVisible();
    await expect(page.locator('#field-reason')).toBeVisible();

    // Fill in required leave fields
    await page.locator('#field-designation_or_roll').fill('Software Engineer');
    await page.locator('#field-organization_name').fill('Tech Corp India');
    await page.locator('#field-recipient_title').fill('Branch Manager');
    await page.locator('#field-recipient_address').fill('Bhopal');
    await page.locator('#field-leave_type').selectOption('Medical Leave');
    await page.locator('#field-start_date').fill('2026-11-01');
    await page.locator('#field-end_date').fill('2026-11-03');
    await page.locator('#field-reason').fill('Viral fever recovery as advised by physician');

    // Click Next Step
    await page.locator('#btn-next-step').click();

    // Since leave application has requiredDocuments: [], it skips document step straight to review
    // Verify document slots do NOT appear and review paper is loaded
    await expect(page.locator('[data-testid="doc-slot-photo"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-download-pdf"]')).toBeVisible();
    await expect(page.locator('.doc-paper')).toBeVisible();
  });

  // Test 2: A scholarship form shows document steps
  test('A scholarship form shows document steps', async ({ page }) => {
    await page.goto('/forms/new');

    // Select Scholarship Application template
    const scholarshipCard = page.locator('[data-testid="template-scholarship_application"]');
    await expect(scholarshipCard).toBeVisible();
    await scholarshipCard.click();

    // Fill in all required fields
    await fillScholarshipRequiredFields(page);

    // Proceed to Step 3 (Document Checklist)
    await page.locator('#btn-next-step').click();

    // Verify document checklist slots are displayed
    await expect(page.locator('[data-testid="doc-slot-photo"]')).toBeVisible();
    await expect(page.locator('[data-testid="doc-slot-signature"]')).toBeVisible();
    await expect(page.locator('[data-testid="doc-slot-aadhaar"]')).toBeVisible();
    await expect(page.locator('[data-testid="doc-slot-marksheet"]')).toBeVisible();
    await expect(page.locator('[data-testid="doc-slot-income_certificate"]')).toBeVisible();

    // Verify allowed formats and limits are communicated
    const photoSlot = page.locator('[data-testid="doc-slot-photo"]');
    await expect(photoSlot).toContainText('Max size: 200 KB');
    await expect(photoSlot).toContainText('JPG, JPEG, PNG');
  });

  // Test 3: Profile values prefill
  test('Profile values prefill', async ({ page }) => {
    await page.goto('/forms/new');

    // Click Scholarship template
    await page.locator('[data-testid="template-scholarship_application"]').click();

    // Verify prefilled values from mocked profile
    const nameField = page.locator('#field-applicant_name');
    await expect(nameField).toHaveValue('Raj Vishwakarma');

    const emailField = page.locator('#field-email');
    await expect(emailField).toHaveValue('raj@example.com');

    const mobileField = page.locator('#field-mobile');
    await expect(mobileField).toHaveValue('9876543210');

    // Verify the profile source badge is visible
    const profileBadges = page.locator('[data-testid="source-profile"]');
    await expect(profileBadges.first()).toBeVisible();
    await expect(profileBadges.first()).toContainText('From Profile');
  });

  // Test 4: Missing field is asked and saved
  test('Missing field is asked and saved', async ({ page }) => {
    let savedPayload: any = null;
    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'PUT') {
        savedPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, updated: savedPayload }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'prof_123',
            user_id: 'usr_test_123',
            full_name: 'Raj Vishwakarma',
            phone: '9876543210',
            email: 'raj@example.com',
            address: '123 MG Road',
            city: 'Bhopal',
            state: 'Madhya Pradesh',
            pincode: '462001',
            father_name: '',
            date_of_birth: '2000-01-15',
            preferred_language: 'en',
          }),
        });
      }
    });

    await page.goto('/forms/new');
    await page.locator('[data-testid="template-scholarship_application"]').click();

    // Enter missing father_name
    const fatherField = page.locator('#field-father_name');
    await fatherField.fill('Shri Ramakant Vishwakarma');

    // Save to profile button appears
    const saveBtn = page.locator('[data-testid="btn-save-profile-father_name"]');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify API called and feedback badge displayed
    await expect(saveBtn).toContainText('Saved!');
    expect(savedPayload).toEqual({ father_name: 'Shri Ramakant Vishwakarma' });
  });

  // Test 5: An oversized image is compressed to the limit
  test('An oversized image is compressed to the limit', async ({ page }) => {
    await page.goto('/forms/new');
    await page.locator('[data-testid="template-scholarship_application"]').click();

    // Fill required fields to advance to documents
    await fillScholarshipRequiredFields(page);
    await page.locator('#btn-next-step').click();

    // Create an oversized synthetic image buffer (e.g. 500 KB > 200 KB limit)
    const largeBuffer = Buffer.alloc(500 * 1024, 0x41);

    // Upload to photo slot
    await page.locator('[data-testid="upload-photo"]').setInputFiles({
      name: 'passport_large_photo.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer,
    });

    // Verify oversize alert is rendered
    const alertEl = page.locator('[data-testid="oversize-alert-photo"]');
    await expect(alertEl).toBeVisible();
    await expect(alertEl).toContainText('exceeds the limit of 200 KB');

    // Verify compress button
    const compressBtn = page.locator('[data-testid="btn-compress-photo"]');
    await expect(compressBtn).toBeVisible();
    await compressBtn.click();

    // Verify compression finishes successfully
    await expect(page.locator('text=Compressed successfully')).toBeVisible();
  });

  // Test 6: The final package lists the enclosures
  test('The final package lists the enclosures', async ({ page }) => {
    await page.goto('/forms/new');
    await page.locator('[data-testid="template-scholarship_application"]').click();

    // Fill required fields
    await fillScholarshipRequiredFields(page);
    await page.locator('#btn-next-step').click();

    // Attach documents
    const validPhoto = Buffer.alloc(100 * 1024, 0x42);
    await page.locator('[data-testid="upload-photo"]').setInputFiles({
      name: 'passport_raj.jpg',
      mimeType: 'image/jpeg',
      buffer: validPhoto,
    });

    const validSign = Buffer.alloc(50 * 1024, 0x43);
    await page.locator('[data-testid="upload-signature"]').setInputFiles({
      name: 'sign_raj.jpg',
      mimeType: 'image/jpeg',
      buffer: validSign,
    });

    // Attach vault docs or files for remaining required docs
    await page.locator('[data-testid="select-vault-aadhaar"]').selectOption('doc-vault-1');
    await page.locator('[data-testid="select-vault-marksheet"]').selectOption('doc-vault-2');
    await page.locator('[data-testid="upload-income_certificate"]').setInputFiles({
      name: 'income_cert.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(50 * 1024, 0x44),
    });

    // Skip optional caste certificate
    await page.locator('[data-testid="btn-skip-caste_certificate"]').click().catch(() => {});

    // Proceed to review
    await page.locator('#btn-proceed-review').click();

    // Verify Review step shows enclosures list
    const enclosuresEl = page.locator('[data-testid="enclosures-list"]');
    await expect(enclosuresEl).toBeVisible();
    await expect(enclosuresEl).toContainText('passport_raj.jpg');

    // Verify Download Package button exists
    const pkgBtn = page.locator('#btn-download-package');
    await expect(pkgBtn).toBeVisible();
    await expect(pkgBtn).toContainText('Download Package');
  });
});
