interface IMailData {
  participantName: string;
  workshopTitle: string;
  startDate: string; // Pre-formatted for display: e.g. "25 March 2026"
  time: string;      // e.g. "15:00"
  location: string;
  rawDate: Date;     // For the calendar link
}

export const WorkshopConfirmationMail = ({
  participantName,
  workshopTitle,
  startDate,
  time,
  location,
  rawDate
}: IMailData) => {
  // Helper to generate Google Calendar link
  const encodedTitle = encodeURIComponent(workshopTitle);
  const encodedLocation = encodeURIComponent(location);
  
  // Format for Google Calendar: YYYYMMDDTHHMMSSZ
  const [h, m] = time.includes(":") ? time.split(":").map(Number) : [9, 0];
  const startDateTime = new Date(rawDate);
  startDateTime.setHours(h, m, 0);
  
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(startDateTime.getHours() + 2);

  const formatCal = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");
  
  const startStamp = formatCal(startDateTime);
  const endStamp = formatCal(endDateTime);

  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startStamp}/${endStamp}&location=${encodedLocation}`;

  return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">

<head>
	<title></title>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0"><!--[if mso]>
<xml><w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"><w:DontUseAdvancedTypographyReadingMail/></w:WordDocument>
<o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml>
<![endif]--><!--[if !mso]><!--><!--<![endif]-->
	<style>
		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			padding: 0;
		}

		a[x-apple-data-detectors] {
			color: inherit !important;
			text-decoration: inherit !important;
		}

		#MessageViewBody a {
			color: inherit;
			text-decoration: none;
		}

		p {
			line-height: inherit
		}

		.desktop_hide,
		.desktop_hide table {
			mso-hide: all;
			display: none;
			max-height: 0px;
			overflow: hidden;
		}

		.image_block img+div {
			display: none;
		}

		sup,
		sub {
			font-size: 75%;
			line-height: 0;
		}

		@media (max-width:700px) {

			.desktop_hide table.icons-inner,
			.row-2 .column-1 .block-3.button_block .alignment .button {
				display: inline-block !important;
			}

			.icons-inner {
				text-align: center;
			}

			.icons-inner td {
				margin: 0 auto;
			}

			.image_block div.fullWidth {
				max-width: 100% !important;
			}

			.mobile_hide {
				display: none;
			}

			.row-content {
				width: 100% !important;
			}

			.stack .column {
				width: 100%;
				display: block;
			}

			.mobile_hide {
				min-height: 0;
				max-height: 0;
				max-width: 0;
				overflow: hidden;
				font-size: 0px;
			}

			.desktop_hide,
			.desktop_hide table {
				display: table !important;
				max-height: none !important;
			}

			.row-2 .column-1 .block-2.paragraph_block td.pad>div {
				text-align: left !important;
				font-size: 14px !important;
			}

			.row-2 .column-1 .block-1.heading_block h1,
			.row-2 .column-1 .block-3.button_block .alignment {
				text-align: left !important;
			}

			.row-2 .column-1 .block-1.heading_block h1 {
				font-size: 20px !important;
			}

			.row-2 .column-1 .block-3.button_block span {
				font-size: 14px !important;
				line-height: 28px !important;
			}

			.row-2 .column-1 .col-pad {
				padding: 0 24px 48px !important;
			}
		}
	</style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
</head>

<body class="body" style="background-color: #f8f6ff; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
	<table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f8f6ff; background-image: none; background-position: top left; background-size: auto; background-repeat: no-repeat;">
		<tbody>
			<tr>
				<td>
					<table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fbf3e0; color: #000000; width: 680px; margin: 0 auto;" width="680">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top;">
													<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="col-pad" style="padding-left:48px;padding-right:48px;">
																<table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
																	<tr>
																		<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
																			<div class="alignment" align="center">
																				<div class="fullWidth" style="max-width: 584px;"><img src="https://259071beb2.imgdist.com/pub/bfra/ai5ijq1c/dua/6lr/y0x/TGN_ELEMENTS_PNG-12.png" style="display: block; height: auto; border: 0; width: 100%;" width="584" alt title height="auto"></div>
																			</div>
																		</td>
																	</tr>
																</table>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fbf3e0; color: #000000; border-radius: 0; width: 680px; margin: 0 auto;" width="680">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top;">
													<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="col-pad" style="padding-bottom:48px;padding-left:48px;padding-right:48px;">
																<table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
																	<tr>
																		<td class="pad" style="padding-top:12px;text-align:center;width:100%;">
																			<h1 style="margin: 0; color: #000000; direction: ltr; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; letter-spacing: normal; line-height: 1.2; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 38px;"><span class="tinyMce-placeholder" style="word-break: break-word;">Dear ${participantName},</span></h1>
																		</td>
																	</tr>
																</table>
																<table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
																	<tr>
																		<td class="pad" style="padding-bottom:10px;padding-top:10px;">
																			<div style="color:#000000;direction:ltr;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:1.2;text-align:left;mso-line-height-alt:19px;">
																				<p style="margin: 0; margin-bottom: 16px;">We are very excited to confirm that your <strong>workshop booking request has been accepted</strong> 🎉</p>
																				<p style="margin: 0; margin-bottom: 16px;">Here are the details of your workshop:</p>
																				<p style="margin: 0; margin-bottom: 16px;"><strong>Program:</strong> ${workshopTitle}</p>
                                        <p style="margin: 0; margin-bottom: 16px;"><strong>Start Date:</strong> ${startDate}<br><strong>Time:</strong> ${time}<br><strong>Location:</strong> ${location}</p>
																				<p style="margin: 0; margin-bottom: 16px;">Please make sure to <strong>arrive on time and do not be late</strong>, so you can get the full benefit of the workshop.</p>
																				<p style="margin: 0; margin-bottom: 16px;">If you have any questions, feel free to contact us.</p>
																				<p style="margin: 0; margin-bottom: 16px;">We look forward to seeing you!</p>
																				<p style="margin: 0;">Best regards,<br>The Good News Team</p>
																			</div>
																		</td>
																	</tr>
																</table>
																<table class="button_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
																	<tr>
																		<td class="pad" style="padding-top:24px;text-align:center;">
																			<div class="alignment" align="center"><a href="${calendarUrl}" target="_blank" style="color:#fbf3e0;text-decoration:none;"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"  href="${calendarUrl}"  style="height:47px;width:206px;v-text-anchor:middle;" arcsize="18%" fillcolor="#ff99cc">
<v:stroke dashstyle="Solid" weight="0px" color="#ff99cc"/>
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#fbf3e0;font-family:sans-serif;font-size:16px">
<![endif]--><span class="button" style="background-color: #ff99cc; border-bottom: 0px solid transparent; border-left: 0px solid transparent; border-radius: 8px; border-right: 0px solid transparent; border-top: 0px solid transparent; color: #fbf3e0; display: inline-block; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; mso-border-alt: none; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span class="btn-pad" style="word-break: break-word; padding-left: 16px; padding-right: 16px; padding-top: 8px; padding-bottom: 8px; display: block;"><span style="word-break: break-word; line-height: 32px;">Add To Google Calendar</span></span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
																		</td>
																	</tr>
																</table>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 680px; margin: 0 auto;" width="680">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top;">
													<table class="empty_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad">
																<div></div>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
									</td>
			</tr>
		</tbody>
	</table><!-- End -->
</body>

</html>`;
};