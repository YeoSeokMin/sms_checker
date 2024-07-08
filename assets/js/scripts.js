var phoneNumbers = [];
var uniquePhoneNumbers = [];
var invalidCount = 0; // 유효하지 않은 번호 개수를 세기 위한 변수
var totalCount = 0; // 전체 번호 개수를 세기 위한 변수
var removedDuplicateCount = 0; // 중복된 번호 개수를 세기 위한 변수
var fileName = ''; // 파일 이름을 저장하기 위한 변수

$(document).ready(function () {
    $('#fileUpload').on('change', function (e) {
        var file = e.target.files[0];
        fileName = file.name.split('.').slice(0, -1).join('.'); // 확장자 제외한 파일 이름 저장
        var reader = new FileReader();

        reader.onload = function (e) {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });

            var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            var jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // 초기화
            totalCount = 0;
            invalidCount = 0;
            phoneNumbers = [];

            // A열의 데이터만 추출 및 처리
            jsonData.forEach(row => {
                totalCount++;
                if (row && row[0]) { // row와 row[0]이 유효한지 확인
                    var cleanedNumber = String(row[0]).replace(/[^0-9]/g, ''); // 숫자가 아닌 모든 문자 제거
                    var lastEightDigits = cleanedNumber.slice(-8); // 끝에서 8자리 추출
                    if (lastEightDigits.length === 8) {
                        phoneNumbers.push('8210' + lastEightDigits); // 8자리만 배열에 저장하고 앞에 8210 추가
                    } else {
                        invalidCount++; // 유효하지 않은 번호 개수 증가
                    }
                } else {
                    invalidCount++; // 유효하지 않은 번호 개수 증가
                }
            });

            // 중복 제거
            var uniqueSet = new Set(phoneNumbers);
            uniquePhoneNumbers = Array.from(uniqueSet);
            removedDuplicateCount = phoneNumbers.length - uniquePhoneNumbers.length;
        };

        reader.readAsArrayBuffer(file);
    });

    $('#confirmButton').on('click', function () {
        if (totalCount > 0) {
            // 결과를 숨기고 버튼을 보여줌
            $('#result').hide();
            $('#toggleResultButton').show();
            $('#downloadButtons').show();

            // HTML로 출력
            var html = '<ul>';
            uniquePhoneNumbers.forEach(number => {
                html += '<li>' + number + '</li>';
            });
            html += '</ul>';

            $('#result').html(html);
            $('#count').html('유효한 번호 총 개수: ' + uniquePhoneNumbers.length);
            $('#removedCount').html('중복된 번호 개수: ' + removedDuplicateCount);
            $('#removedCount').append('<br>유효하지 않은 번호 개수: ' + invalidCount);
            $('#removedCount').append('<br>총 삭제된 개수: ' + (removedDuplicateCount + invalidCount));
            $('#removedCount').append('<br>전체 데이터 개수: ' + totalCount);

            // Copy buttons 생성
            $('#copyButtons').html('');
            for (let i = 0; i < uniquePhoneNumbers.length; i += 10000) {
                let start = i + 1;
                let end = i + 10000 > uniquePhoneNumbers.length ? uniquePhoneNumbers.length : i + 10000;
                let range = `${start}~${end}`;
                let button = `<button onclick="copyToClipboard(${i}, ${end}, this)">${range}</button>`;
                $('#copyButtons').append(button);
            }

            // Download buttons 생성
            $('#downloadButtons').html('<button onclick="downloadAll(this)">전체 다운로드</button><br>');
            $('#downloadButtons').append('<button onclick="downloadSequentially()">전체 순차 다운로드</button><br>');
            for (let i = 0; i < uniquePhoneNumbers.length; i += 10000) {
                let start = i + 1;
                let end = i + 10000 > uniquePhoneNumbers.length ? uniquePhoneNumbers.length : i + 10000;
                let range = `${start}~${end}`;
                let button = `<button onclick="downloadRange(${i}, ${end}, '${fileName} 수정본 ${start}-${end}.xlsx', this)">${range} 다운로드</button>`;
                $('#downloadButtons').append(button);
            }
        } else {
            $('#result').html('<p>먼저 파일을 업로드해주세요.</p>');
            $('#count').html('');
            $('#removedCount').html('');
            $('#copyButtons').html('');
        }
    });

    $('#toggleResultButton').on('click', function () {
        $('#result').toggle();
    });

    $('#downloadButton').on('click', function () {
        var wb = XLSX.utils.book_new();
        var ws = XLSX.utils.aoa_to_sheet(uniquePhoneNumbers.map(number => [number]));
        XLSX.utils.book_append_sheet(wb, ws, 'Unique Phone Numbers');

        var downloadFileName = fileName + ' 수정본.xlsx';
        XLSX.writeFile(wb, downloadFileName);
    });

    $('#rangeCopyButton').on('click', function () {
        var startIndex = parseInt($('#startIndex').val()) - 1;
        var endIndex = parseInt($('#endIndex').val());

        if (startIndex >= 0 && endIndex <= uniquePhoneNumbers.length && startIndex < endIndex) {
            copyToClipboard(startIndex, endIndex);
        } else {
            alert('유효한 범위를 입력해주세요.');
        }
    });
});

function copyToClipboard(start, end, button) {
    var textToCopy = uniquePhoneNumbers.slice(start, end).join('\n');
    navigator.clipboard.writeText(textToCopy).then(function () {
        alert('클립보드에 복사되었습니다.');
        if (button) {
            $(button).addClass('clicked'); // 버튼 배경색을 빨간색으로 변경
        }
    }, function (err) {
        console.error('클립보드 복사 실패: ', err);
    });
}

function downloadRange(start, end, filename, button) {
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(uniquePhoneNumbers.slice(start, end).map(number => [number]));
    XLSX.utils.book_append_sheet(wb, ws, 'Unique Phone Numbers');

    XLSX.writeFile(wb, filename);
    if (button) {
        $(button).css('background-color', 'red'); // 버튼 배경색을 빨간색으로 변경
    }
}

function downloadAll(button) {
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(uniquePhoneNumbers.map(number => [number]));
    XLSX.utils.book_append_sheet(wb, ws, 'Unique Phone Numbers');

    var downloadFileName = fileName + ' 전체 수정본.xlsx';
    XLSX.writeFile(wb, downloadFileName);
    if (button) {
        $(button).css('background-color', 'red'); // 버튼 배경색을 빨간색으로 변경
    }
}

function downloadSequentially() {
    for (let i = 0; i < uniquePhoneNumbers.length; i += 10000) {
        let start = i + 1;
        let end = i + 10000 > uniquePhoneNumbers.length ? uniquePhoneNumbers.length : i + 10000;
        let filename = `${fileName} 수정본 ${start}-${end}.xlsx`;
        setTimeout(() => downloadRange(i, end, filename), i / 10000 * 2000); // 2초 간격으로 다운로드
    }
}
