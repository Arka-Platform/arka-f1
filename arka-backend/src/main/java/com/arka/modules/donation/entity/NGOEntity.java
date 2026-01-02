package com.arka.modules.donation.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ngos")
public class NGOEntity extends BaseEntity {

  @Column(nullable = false)
  private String name;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(length = 200)
  private String location;

  @Column(nullable = false)
  private Boolean verified = false;

  @Column(name = "books_received")
  private Integer booksReceived = 0;

  @ElementCollection(fetch = FetchType.EAGER)
  @jakarta.persistence.CollectionTable(name = "ngos_categories", joinColumns = @jakarta.persistence.JoinColumn(name = "ngos_id"))
  @Column(name = "category")
  private List<String> categories = new ArrayList<>();

  @Column(name = "contact_email")
  private String contactEmail;

  @Column(name = "contact_phone")
  private String contactPhone;

  @Column(length = 500)
  private String website;

  protected NGOEntity() {
    // JPA
  }

  public NGOEntity(String name, String description, String location) {
    this.name = name;
    this.description = description;
    this.location = location;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public Boolean getVerified() {
    return verified;
  }

  public void setVerified(Boolean verified) {
    this.verified = verified;
  }

  public Integer getBooksReceived() {
    return booksReceived;
  }

  public void setBooksReceived(Integer booksReceived) {
    this.booksReceived = booksReceived;
  }

  public List<String> getCategories() {
    return categories;
  }

  public void setCategories(List<String> categories) {
    this.categories = categories;
  }

  public String getContactEmail() {
    return contactEmail;
  }

  public void setContactEmail(String contactEmail) {
    this.contactEmail = contactEmail;
  }

  public String getContactPhone() {
    return contactPhone;
  }

  public void setContactPhone(String contactPhone) {
    this.contactPhone = contactPhone;
  }

  public String getWebsite() {
    return website;
  }

  public void setWebsite(String website) {
    this.website = website;
  }
}

