package com.arka.modules.donation.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "donations")
public class DonationEntity extends BaseEntity {

  @Column(name = "ngo_id", nullable = false)
  private UUID ngoId;

  @Column(name = "donor_name", nullable = false)
  private String donorName;

  @Column(name = "donor_email", nullable = false)
  private String donorEmail;

  @Column(name = "donor_phone", nullable = false)
  private String donorPhone;

  @Enumerated(EnumType.STRING)
  @Column(name = "donor_type", nullable = false)
  private DonorType donorType;

  @Column(name = "institution_name")
  private String institutionName;

  @Column(name = "book_count", nullable = false)
  private Integer bookCount;

  @ElementCollection(fetch = FetchType.EAGER)
  @jakarta.persistence.CollectionTable(name = "donations_book_categories", joinColumns = @jakarta.persistence.JoinColumn(name = "donations_id"))
  @Column(name = "category")
  private List<String> bookCategories = new ArrayList<>();

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BookCondition condition;

  @Column(name = "pickup_street", nullable = false)
  private String pickupStreet;

  @Column(name = "pickup_city", nullable = false)
  private String pickupCity;

  @Column(name = "pickup_state", nullable = false)
  private String pickupState;

  @Column(name = "pickup_pincode", nullable = false)
  private String pickupPincode;

  @Column(name = "additional_notes", columnDefinition = "TEXT")
  private String additionalNotes;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private DonationStatus status = DonationStatus.PENDING;

  @Column(name = "user_id")
  private UUID userId;

  protected DonationEntity() {
    // JPA
  }

  public DonationEntity(UUID ngoId, String donorName, String donorEmail, String donorPhone,
                       DonorType donorType, Integer bookCount, BookCondition condition,
                       String pickupStreet, String pickupCity, String pickupState,
                       String pickupPincode) {
    this.ngoId = ngoId;
    this.donorName = donorName;
    this.donorEmail = donorEmail;
    this.donorPhone = donorPhone;
    this.donorType = donorType;
    this.bookCount = bookCount;
    this.condition = condition;
    this.pickupStreet = pickupStreet;
    this.pickupCity = pickupCity;
    this.pickupState = pickupState;
    this.pickupPincode = pickupPincode;
  }

  // Getters and Setters
  public UUID getNgoId() {
    return ngoId;
  }

  public void setNgoId(UUID ngoId) {
    this.ngoId = ngoId;
  }

  public String getDonorName() {
    return donorName;
  }

  public void setDonorName(String donorName) {
    this.donorName = donorName;
  }

  public String getDonorEmail() {
    return donorEmail;
  }

  public void setDonorEmail(String donorEmail) {
    this.donorEmail = donorEmail;
  }

  public String getDonorPhone() {
    return donorPhone;
  }

  public void setDonorPhone(String donorPhone) {
    this.donorPhone = donorPhone;
  }

  public DonorType getDonorType() {
    return donorType;
  }

  public void setDonorType(DonorType donorType) {
    this.donorType = donorType;
  }

  public String getInstitutionName() {
    return institutionName;
  }

  public void setInstitutionName(String institutionName) {
    this.institutionName = institutionName;
  }

  public Integer getBookCount() {
    return bookCount;
  }

  public void setBookCount(Integer bookCount) {
    this.bookCount = bookCount;
  }

  public List<String> getBookCategories() {
    return bookCategories;
  }

  public void setBookCategories(List<String> bookCategories) {
    this.bookCategories = bookCategories;
  }

  public BookCondition getCondition() {
    return condition;
  }

  public void setCondition(BookCondition condition) {
    this.condition = condition;
  }

  public String getPickupStreet() {
    return pickupStreet;
  }

  public void setPickupStreet(String pickupStreet) {
    this.pickupStreet = pickupStreet;
  }

  public String getPickupCity() {
    return pickupCity;
  }

  public void setPickupCity(String pickupCity) {
    this.pickupCity = pickupCity;
  }

  public String getPickupState() {
    return pickupState;
  }

  public void setPickupState(String pickupState) {
    this.pickupState = pickupState;
  }

  public String getPickupPincode() {
    return pickupPincode;
  }

  public void setPickupPincode(String pickupPincode) {
    this.pickupPincode = pickupPincode;
  }

  public String getAdditionalNotes() {
    return additionalNotes;
  }

  public void setAdditionalNotes(String additionalNotes) {
    this.additionalNotes = additionalNotes;
  }

  public DonationStatus getStatus() {
    return status;
  }

  public void setStatus(DonationStatus status) {
    this.status = status;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }
}

