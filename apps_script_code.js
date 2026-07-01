function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('回答')
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet('回答');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '送信日時',
      '開始日時',
      '名前',
      '正解数',
      '総問題数',
      '正答率',
      '難易度',
      '回答詳細JSON'
    ]);
  }

  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.submittedAt || '',
    data.startedAt || '',
    data.name || '',
    data.score ?? '',
    data.total ?? '',
    (data.percent ?? '') + '%',
    data.difficulty || '',
    JSON.stringify(data.answers || [])
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
