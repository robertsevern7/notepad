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
	$scope.sections = {
	    data: [[]],
	    clearData: function() {
	    	$scope.sections.data = [[]]
	    },
		addSection: function(title, text) {
			var count = 0;
			for (var i = 0, len = $scope.sections.data.length; i < len; i++) {
				for (var j = 0, len2 = $scope.sections.data[i].length; j < len2; j++) {
					count++;
				}
			}
			var nextId = 'section_' + count;
			var currRow = $scope.sections.data[$scope.sections.data.length - 1];			
			
			var display = text || (title ? '' : $scope.PROMPT_TEXT);
		    var emptyContent = !(text || title);
			
		    var newSection = {
				id: nextId,
				title: title || '',
				text: text || '',
				displayText: display,
				emptyContent: emptyContent
			}
			if (currRow.length === $scope.ROW_SIZE) {
				currRow = [];
				$scope.sections.data.push(currRow);
			}
			currRow.push(newSection);
			
			setTimeout(function() {
				var index;
				var draggedIndex;
				var dragged;
				
				$('.bordered').draggable({
					containment: '.bitOnRight',
					revert: 'invalid',
					stack: '.bordered',
					cursorAt: {left: 20, top: 20},
					helper: function(event) {						
						return $("<div class='contenthover'></div>")[0];
					},
					start: function() {
						$(this).addClass('dragged');
						$(this).fadeTo(200, 0.7);						
						draggedIndex = this.id;
					},
					stop: function() {
						$(this).removeClass('dragged');
						$(this).fadeTo(200, 1);						
					}					 
				});
				
				$(".bordered" ).droppable({
				    over: function(event, ui) {
				    	var sectionId = this.id;
				    	var previous;
				    	var behind = false;
				    	
				    	$(this).fadeTo(200, 0.7);
				    	$scope.$apply(function(){					    	
					    	$scope.sections.backup = [];
					    	
					    	for (var i = 0, len = $scope.sections.data.length; i < len; ++i) {
					    		var currentBackupRow = [];
					    		$scope.sections.backup.push(currentBackupRow);
				        		var subArray = $scope.sections.data[i];
				        		for (var j = 0, len2 = subArray.length; j < len2; ++j) {
				        			var section = subArray[j];
				        			
				        			var copy = $.extend({}, section);
				        			currentBackupRow.push(copy);				        			
				        			
				        			if (behind) {				        				
				        				previous.displayText = copy.displayText;
				        				previous.text = copy.text;
				        				previous.title = copy.title;
				        			}
				        			
				        			if (section.id === draggedIndex) {				        			
				        				dragged = $.extend({}, section);
				        				behind = true; 
				        			} else if (section.id === sectionId) {				        			
				        				behind = false;
				        				section.displayText = dragged.displayText;
				        				section.text = dragged.text;
				        				section.title = dragged.title;
				        			} 
				        			
				        			previous = section;
				        		}
				        	}					    	
				    	});
				    },
				    out: function() {
				    	$(this).fadeTo(200, 1);
				    	$scope.$apply(function(){				    		
					    	for (var i = 0, len = $scope.sections.data.length; i < len; ++i) {					    							    	
				        		var backUpSubArray = $scope.sections.backup[i];
				        		var dataSubArray = $scope.sections.data[i];
				        		
				        		for (var j = 0, len2 = backUpSubArray.length; j < len2; ++j) {
				        			var backUpSection = backUpSubArray[j];
				        			var dataSection = dataSubArray[j];
				        			$.extend(dataSection, backUpSection);				        							        			
				        		}
				        	}					    	
				    	});				    	
				    },
				    drop: function(event, ui) {
				    	$scope.sections.setActive(this.id);
				    	$(this).fadeTo(200, 1);				    	
				    }
				});
			}, 100);
			return nextId;
		},
		getOutputFormat: function() {
			var outputContent = [];
        	
        	for (var i = 0, len = $scope.sections.data.length; i < len; ++i) {
        		var subArray = $scope.sections.data[i];
        		for (var j = 0, len2 = subArray.length; j < len2; ++j) {
        			outputContent.push(subArray[j]);
        		}
        	}
        	
        	return outputContent;
		},
		setActive: function(id) {
			findActiveSection(id);
			$('.selected').removeClass('selected');
			var ed = $('#editor');
			var title = $('#titleBox');
			var arrow = $('.arrow_box');
			
			var titleText = title.val();
			var edText = ed.val();
			
			arrow.animate({
				opacity: 1
			}, 750, function() {
				arrow.animate({
					opacity: 0
				}, 750);
			});				
									
			var pos;
			
			if (titleText || edText) {			
				ed.val('');
				ed.focus();
				ed.val(edText);
				ed.addClass('focused');
				pos = ed.position();
			} else {			
				title.val('');
				title.focus();
				title.val(titleText);				
				title.addClass('focused');
				pos = title.position();
			}			
			
			arrow.css('left', (pos.left + 80) + 'px');
			arrow.css('top', pos.top + 'px');
			
			setTimeout(function() {
				$('#' + id).addClass('selected');
			}, 100);
			
			setTimeout(function() {
				ed.removeClass('focused');
				title.removeClass('focused');
			}, 1500);
		}
	};
	
	editor.DataToSave = $scope.sections;    
    $scope.sections.addSection();    
	
	var editorInput = $('#editor');
	var titleBox = $('#titleBox');
	
	$scope.updateSelectedBox = function() {
		$scope.activeSection.title = titleBox.val();
		$scope.activeSection.text = editorInput.val();
		$scope.activeSection.displayText = editorInput.val() || (titleBox.val() ? '' : $scope.PROMPT_TEXT);
		$scope.activeSection.emptyContent = !(editorInput.val() || titleBox.val());
		
		editor.DataToSave = $scope.sections;
	}
	
	var findActiveSection = function(id) {
		for (var i = 0, len = $scope.sections.data.length; i < len; i++) {
			for (var j = 0, len2 = $scope.sections.data[i].length; j < len2; j++) {
				if ($scope.sections.data[i][j].id === id) {
					$scope.activeSection = $scope.sections.data[i][j];
					
					titleBox.val($scope.activeSection.title);
					editorInput.val($scope.activeSection.text);
					return;
				}
			}
		}
	} 
			
	$scope.addSection = function() {
		var nextId = $scope.sections.addSection();
	    $scope.sections.setActive(nextId);	    
	}
	
	$scope.setActive = function(id) {
		$scope.sections.setActive(id);
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