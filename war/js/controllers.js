'use strict';

function UserCtrl($scope, backend) {
    $scope.user = null;
    $scope.login = function () {
        backend.user().then(function (response) {
            $scope.user = response.data;
        });
    }
    $scope.login();
}

function UpdaterCtrl($scope, editor) {
	$scope.ROW_SIZE = 3;
	$scope.PROMPT_TEXT = 'Add Content';
	$scope.sections = [
		[{
			id: 'section_0',
			title: '',
			text: '',
			displayText: $scope.PROMPT_TEXT,
			emptyContent: true
		}]
    ];
	
	var editorInput = $('#editor');
	var titleBox = $('#titleBox');
		
	setTimeout(function() {
	    $scope.setActive($scope.sections[0][0].id);
	}, 500);
	
	$scope.updateSelectedBox = function() {
		$scope.activeSection.title = titleBox.val();
		$scope.activeSection.text = editorInput.val();
		$scope.activeSection.displayText = editorInput.val() || (titleBox.val() ? '' : $scope.PROMPT_TEXT);
		$scope.activeSection.emptyContent = !(editorInput.val() || titleBox.val());
		
		editor.DataToSave = $scope.sections;
	}
	
	var findActiveSection = function(id) {
		for (var i = 0, len = $scope.sections.length; i < len; i++) {
			for (var j = 0, len2 = $scope.sections[i].length; j < len2; j++) {
				if ($scope.sections[i][j].id === id) {
					$scope.activeSection = $scope.sections[i][j];
					
					titleBox.val($scope.activeSection.title);
					editorInput.val($scope.activeSection.text);
					return;
				}
			}
		}
	} 
		
	$scope.setActive = function(id) {
		findActiveSection(id);
		$('.selected').removeClass('selected');
		var ed = $('#editor');
		var title = $('#titleBox');
		
		var titleText = title.val();
		var edText = ed.val();
		
		//clear to allow text at end
		if (titleText || edText) {			
			ed.val('');
			ed.focus();
			ed.val(edText);
		} else {			
			title.val('');
			title.focus();
			title.val(titleText);
		}
		
		setTimeout(function() {
			$('#' + id).addClass('selected');
		}, 100)		
	}
	
	$scope.addSection = function() {
		var count = 0;
		for (var i = 0, len = $scope.sections.length; i < len; i++) {
			for (var j = 0, len2 = $scope.sections[i].length; j < len2; j++) {
				count++;
			}
		}
		var nextId = 'section_' + count;
		var currRow = $scope.sections[$scope.sections.length - 1]

	    var newSection = {
			id: nextId,
			title: '',
			text: '',
			displayText: $scope.PROMPT_TEXT,
			emptyContent: true
		}
		if (currRow.length === $scope.ROW_SIZE) {
			currRow = [];
			$scope.sections.push(currRow);
		}
		currRow.push(newSection);
		
		$scope.setActive(nextId);
	}
}

function EditorCtrl($scope, $location, $routeParams, $timeout, editor, doc, autosaver) {
    $scope.editor = editor;
    $scope.doc = doc;
    $scope.$on('saved',
        function (event) {
            $location.path('/edit/' + doc.resource_id);
        });
    if ($routeParams.id) {
        editor.load($routeParams.id);
    } else {
        // New doc, but defer to next event cycle to ensure init
        $timeout(function () {
            editor.create($routeParams.folderId);
        }, 1);
    }
}

function ShareCtrl($scope, appId, doc) {
    var client = new gapi.drive.share.ShareClient(appId);
    $scope.enabled = function() {
        return doc.resource_id != null;
    };
    $scope.share = function() {
        client.setItemIds([doc.resource_id]);
        client.showSettingsDialog();
    }
}

function MenuCtrl($scope, $location, appId) {
    var onFilePicked = function (data) {
        $scope.$apply(function () {
            if (data.action == 'picked') {
                var id = data.docs[0].id;
                $location.path('/edit/' + id);
            }
        });
    };
    $scope.open = function () {
        var view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes('text/plain');
        var picker = new google.picker.PickerBuilder()
            .setAppId(appId)
            .addView(view)
            .setCallback(angular.bind(this, onFilePicked))
            .build();
        picker.setVisible(true);
    };
    $scope.create = function () {
        this.editor.create();
    };
    $scope.save = function () {
        this.editor.save(true);
    }
}

function RenameCtrl($scope, doc) {
    $('#rename-dialog').on('show',
        function () {
            $scope.$apply(function () {
                $scope.newFileName = doc.info.title;
            });
        });
    $scope.save = function () {
        doc.info.title = $scope.newFileName;
        $('#rename-dialog').modal('hide');
    };
}

function AboutCtrl($scope, backend) {
    $('#about-dialog').on('show',
        function () {
            backend.about().then(function (result) {
                $scope.info = result.data;
            });
        });
}