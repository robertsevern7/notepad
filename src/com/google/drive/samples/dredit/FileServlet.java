/*
 * Copyright (c) 2012 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

package com.google.drive.samples.dredit;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.ByteArrayContent;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpResponse;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.oauth2.Oauth2;
import com.google.api.services.oauth2.model.Userinfo;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Query;
import com.google.drive.samples.dredit.model.ClientFile;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Servlet providing a small API for the DrEdit JavaScript client to use in
 * manipulating files.  Each operation (GET, POST, PUT) issues requests to the
 * Google Drive API.
 *
 * @author vicfryzel@google.com (Vic Fryzel)
 */

/*
 * Datastore format
 * User
 *   FileID
 *     Section (Same group as FileID)
 */

@SuppressWarnings("serial")
public class FileServlet extends UserServlet {
  /**
   * Given a {@code file_id} URI parameter, return a JSON representation
   * of the given file.
   */
  @Override
  public void doGet(HttpServletRequest req, HttpServletResponse resp)
      throws IOException {
    Drive service = getDriveService(req, resp);
    String fileId = req.getParameter("file_id");
    
    if (fileId == null) {
      sendError(resp, 400, "The `file_id` URI parameter must be specified.");
      return;
    }

    File file = null;
    try {
      file = service.files().get(fileId).execute();
    } catch (GoogleJsonResponseException e) {
      if (e.getStatusCode() == 401) {
        // The user has revoked our token or it is otherwise bad.
        // Delete the local copy so that their next page load will recover.
        deleteCredential(req, resp);
        sendError(resp, 401, "Unauthorized");
        return;
      }
    }

    if (file != null) {    	
    	
    	System.out.println("Fetching file");
    	
    	Userinfo userInfo = getUserInfo(req, resp);
    	List<Entity> sections = getSections(userInfo, fileId);
    	
    	JsonArray sectionArray = new JsonArray();
    	System.out.println("Found section count " + sections.size());
    	for (final Entity section : sections) {
    		System.out.println(section);
    		JsonObject sectionObj = new JsonObject();
    		sectionObj.addProperty("title", section.getProperty("title").toString());
    		sectionObj.addProperty("text", section.getProperty("text").toString());
    		sectionArray.add(sectionObj);    
    	}
        
        resp.setContentType(JSON_MIMETYPE);
        resp.getWriter().print(new ClientFile(file, sectionArray.toString()).toJson());
    } else {
      sendError(resp, 404, "File not found");
    }
  }

  /**
   * Create a new file given a JSON representation, and return the JSON
   * representation of the created file.
   */
  @Override
  public void doPost(HttpServletRequest req, HttpServletResponse resp)
      throws IOException {
    Drive service = getDriveService(req, resp);
    ClientFile clientFile = new ClientFile(req.getReader());
    File file = clientFile.toFile();

    if (!clientFile.content.equals("")) {
      file = service.files().insert(file,
          ByteArrayContent.fromString(clientFile.mimeType, convertContentToFileString(clientFile.content)))
          .execute();
      
      DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
      createUserFileEntry(datastore, clientFile.content, file.getId(), getUserInfo(req, resp));
    } else {
      file = service.files().insert(file).execute();
    }

    resp.setContentType(JSON_MIMETYPE);
    resp.getWriter().print(new Gson().toJson(file.getId()).toString());
  }

  /**
   * Update a file given a JSON representation, and return the JSON
   * representation of the created file.
   */
  @Override
  public void doPut(HttpServletRequest req, HttpServletResponse resp)
      throws IOException {
    boolean newRevision = req.getParameter("newRevision").equals(Boolean.TRUE);
    Drive service = getDriveService(req, resp);
    ClientFile clientFile = new ClientFile(req.getReader());
    
    File file = clientFile.toFile();
    // If there is content we update the given file
    if (clientFile.content != null) {
      file = service.files().update(clientFile.resource_id, file,
          ByteArrayContent.fromString(clientFile.mimeType, convertContentToFileString(clientFile.content)))
          .setNewRevision(newRevision).execute();
      
      DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
      createUserFileEntry(datastore, clientFile.content, file.getId(), getUserInfo(req, resp));
    } else { // If there is no content we patch the metadata only
      file = service.files().patch(clientFile.resource_id, file).setNewRevision(newRevision).execute();
    }    
    
    resp.setContentType(JSON_MIMETYPE);
    resp.getWriter().print(new Gson().toJson(file.getId()).toString());
  }
  
  private Userinfo getUserInfo(HttpServletRequest req, HttpServletResponse resp) {
	  
	  Oauth2 service = getOauth2Service(req, resp);
	  try {
		return service.userinfo().get().execute();
	  } catch (IOException e) {		
		e.printStackTrace();		
	  }
	  
	  return null;
  }
  
  private List<Entity> getSections(final Userinfo userInfo, final String fileId) {
	  DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
	  
	  final Key userKey = KeyFactory.createKey("User", userInfo.getId());
	  final Key fileKey = KeyFactory.createKey(userKey, "File", fileId);
	  System.out.println("Filtering on " + fileId);
	  
	  
	  final Query sectionQuery = new Query("File")
	  	.setAncestor(fileKey)
		.addFilter(Entity.KEY_RESERVED_PROPERTY,
                      Query.FilterOperator.GREATER_THAN,
                      fileKey);

      return datastore.prepare(sectionQuery).asList(FetchOptions.Builder.withDefaults());	       
  }
  
  
  
  private List<Entity> createUserFileEntry(final DatastoreService datastore, final String content, final String fileId, final Userinfo user) {
	  JsonElement jelem = new Gson().fromJson(content, JsonElement.class);
	  JsonArray contentObj = jelem.getAsJsonArray();
	  
	  deleteExistingKeys(user, datastore, fileId);
	  
	  final List<Entity> entries = new ArrayList<Entity>();
	  System.out.println("Creating user entity " + user.getId());
	  final Entity userEntity = new Entity("User", user.getId());      	  
	  
	  List<Entity> childEntries = createFileEntry(fileId, contentObj, userEntity);
	  
	  entries.add(userEntity);
	  entries.addAll(childEntries);
	
	  datastore.put(entries);
	
      return entries;
  }

  private void deleteExistingKeys(Userinfo userInfo, final DatastoreService datastore, final String fileId) {
	  List<Entity> existingSections = getSections(userInfo, fileId);
	  List<Key> existingKeys = new ArrayList<Key>();
	  for (Entity entity : existingSections) {
		  existingKeys.add(entity.getKey());
	  }
	  
	  datastore.delete(existingKeys);
  }
  
  private List<Entity> createFileEntry(final String fileId, final JsonArray json, final Entity parentUser) {
	  final List<Entity> entries = new ArrayList<Entity>();
	  final Entity file = new Entity("File", fileId, parentUser.getKey());      	  
	  	  
	  entries.add(file);
	  
	  System.out.println("Now adding " + json.size() + " sections");
	  for (int i = 0; i < json.size(); i++) {
		  final Entity section = createFileSectionEntry(json.get(i).getAsJsonObject(), file);
		  entries.add(section);
	  }
	  System.out.println("createFileEntry gives us " + entries.size());
      return entries;
  }
  
  private Entity createFileSectionEntry(final JsonObject json, final Entity parentFile) {
	  final Entity section = new Entity("File", parentFile.getKey());
	  section.setProperty("title", json.get("title").getAsString());
	  section.setProperty("text", json.get("text").getAsString());      	 	 
	  
      return section;
  }
  
  private String convertContentToFileString(final String contentString) {	  
	  JsonElement jelem = new Gson().fromJson(contentString, JsonElement.class);
	  JsonArray contentObj = jelem.getAsJsonArray();
	  
	  StringBuilder sb = new StringBuilder();
	  
	  for (JsonElement entry : contentObj) {		  		  
		  final JsonObject section = entry.getAsJsonObject(); 
		  sb.append(section.get("title").getAsString()).append("\n");		  
		  sb.append(section.get("text").getAsString()).append("\n\n");
	  }
	  
	  return sb.toString();
  }

  /**
   * Download the content of the given file.
   *
   * @param service Drive service to use for downloading.
   * @param file File metadata object whose content to download.
   * @return String representation of file content.  String is returned here
   *         because this app is setup for text/plain files.
   * @throws IOException Thrown if the request fails for whatever reason.
   */
  private String downloadFileContent(Drive service, File file)
      throws IOException {
    GenericUrl url = new GenericUrl(file.getDownloadUrl());
    HttpResponse response = service.getRequestFactory().buildGetRequest(url)
        .execute();
    try {
      return new Scanner(response.getContent()).useDelimiter("\\A").next();
    } catch (java.util.NoSuchElementException e) {
      return "";
    }
  }

  /**
   * Build and return a Drive service object based on given request parameters.
   *
   * @param req Request to use to fetch code parameter or accessToken session
   *            attribute.
   * @param resp HTTP response to use for redirecting for authorization if
   *             needed.
   * @return Drive service object that is ready to make requests, or null if
   *         there was a problem.
   */
  private Drive getDriveService(HttpServletRequest req,
      HttpServletResponse resp) {
    Credential credentials = getCredential(req, resp);

    return new Drive.Builder(TRANSPORT, JSON_FACTORY, credentials).build();
  }
}