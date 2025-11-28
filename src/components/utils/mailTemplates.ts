// src/utils/mailTemplates.ts

// --- STATUS EMAIL (mismo que ya tenías, solo movido aquí) ---
export const buildStatusEmailHTML = (
    name: string | null,
    contractNo: string,
    newStatus: string
  ) => `
  <html>
    <body style="margin:0;padding:0;background:#f6f8fa;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f8fa;">
        <tr>
          <td align="center" style="padding:24px 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #eaecef;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111;">
              <tr>
                <td style="padding:20px 24px 12px;">
                  <h1 style="margin:0;font-size:18px;line-height:1.3;color:#111;">Your contract status has changed</h1>
                  <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#444;">
                    Hello ${name || 'there'}, your contract <b>#${contractNo}</b> has been updated.
                  </p>
                </td>
              </tr>
              <tr><td style="padding:12px 24px;"><div style="height:1px;background:#eaecef;"></div></td></tr>
              <tr>
                <td style="padding:0 24px 4px;">
                  <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#444;">
                    <b>New status:</b>
                    <span style="display:inline-block;margin-left:6px;padding:2px 8px;font-size:12px;line-height:1.6;border:1px solid #dfe2e6;border-radius:999px;text-transform:capitalize;background:#f3f4f6;color:#111;">
                      ${newStatus}
                    </span>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 16px;">
                  <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#444;">You can review it any time in <b>My Orders</b>.</p>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#444;">If you have questions, just reply to this email.</p>
                </td>
              </tr>
              <tr><td style="padding:16px 24px 20px;"><p style="margin:0;font-size:13px;line-height:1.6;color:#666;">— The Caribbean Goods Team</p></td></tr>
            </table>
            <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#8a8f98;font-family:Arial,Helvetica,sans-serif;">
              This message was sent regarding contract #${contractNo}.
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
  
  // --- DISPATCH EMAIL ---
  
  export interface DispatchEmailLine {
    variety: string;
    bagsDispatched: number;
    kgPerBag?: number;
    totalKg?: number;
    remainingBags?: number;
    remainingKg?: number;
  }
  
  
  
  
  export const buildDispatchEmailHTML = (opts: {
    customerName: string;
    contractNo: string;
    dispatchDateUK: string;
    lines: DispatchEmailLine[];
  }) => {
    const { customerName, contractNo, dispatchDateUK, lines } = opts;
  
    const rows = lines
    .map(
      (line) => `
        <tr>
          <td style="padding:8px 10px;border:1px solid #eaecef;">${line.variety}</td>
          <td style="padding:8px 10px;border:1px solid #eaecef;text-align:center;">${line.bagsDispatched}</td>
          <td style="padding:8px 10px;border:1px solid #eaecef;text-align:center;">${line.totalKg ?? ''}</td>
          <td style="padding:8px 10px;border:1px solid #eaecef;text-align:center;">${line.remainingBags ?? ''}</td>
          <td style="padding:8px 10px;border:1px solid #eaecef;text-align:center;">${line.remainingKg ?? ''}</td>
        </tr>`
    )
    .join('');
  
  
    return `
    <html>
      <body style="margin:0;padding:0;background:#f6f8fa;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f8fa;">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" 
                     style="max-width:620px;background:#ffffff;
                            border:1px solid #eaecef;border-radius:8px;
                            overflow:hidden;font-family:Arial,Helvetica,sans-serif;
                            color:#111;">
                <!-- HEADER -->
                <tr>
                  <td style="padding:20px 24px 12px;">
                    <h1 style="margin:0;font-size:18px;line-height:1.3;color:#111;">
                      Dispatch confirmation
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#444;">
                      Hello ${customerName || 'there'}, we have processed a new delivery related 
                      to your contract <b>#${contractNo}</b>.
                    </p>
                  </td>
                </tr>
  
                <!-- DATE SEPARATOR -->
                <tr><td style="padding:12px 24px;"><div style="height:1px;background:#eaecef;"></div></td></tr>
  
                <tr>
                  <td style="padding:0 24px 4px;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#444;">
                      <b>Dispatch date:</b> ${dispatchDateUK}
                    </p>
                  </td>
                </tr>
  
                <!-- TABLE -->
                <tr>
                  <td style="padding:0 24px 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" 
                           style="border-collapse:collapse;border:1px solid #eaecef;font-size:14px;">
                            <thead>
                                <tr style="background:#fafafa;text-align:left;font-weight:bold;">
                                    <th style="padding:8px 10px;border:1px solid #eaecef;">Variety</th>
                                    <th style="padding:8px 10px;border:1px solid #eaecef;text-align:center;">Dispatched bags</th>
                                    <th style="padding:8px 10px;border:1px solid #eaecef;text-align:center;">Dispatched KG</th>
                                    <th style="padding:8px 10px;border:1px solid #eaecef;text-align:center;">Remaining bags</th>
                                    <th style="padding:8px 10px;border:1px solid #eaecef;text-align:center;">Remaining KG</th>
                                </tr>
                            </thead>

                      <tbody>
                        ${rows}
                      </tbody>
                    </table>
                  </td>
                </tr>
  
                <!-- FOOTER -->
                <tr><td style="padding:16px 24px 20px;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#666;">
                    If you have any questions, just reply to this email.
                    <br />Thank you for your trust in Caribbean Goods!
                  </p>
                </td></tr>
  
              </table>
  
              <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#8a8f98;
                        font-family:Arial,Helvetica,sans-serif;">
                This message was sent regarding contract #${contractNo}.
              </p>
  
            </td>
          </tr>
        </table>
      </body>
    </html>`;
  };
  
  