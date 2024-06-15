package com.example.ageclassifier;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.NotificationCompat;

import com.example.ageclassifier.databinding.ActivityMainBinding;
import com.example.ageclassifier.ml.Model;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.storage.FileDownloadTask;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
// Thư viện xử lí AI
import org.tensorflow.lite.DataType;
import org.tensorflow.lite.support.image.TensorImage;
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer;

import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.Arrays;

public class MainActivity extends AppCompatActivity {
    private static final int NOTIFICATION_ID = 1; //Khai báo một hằng số static final cho ID thông báo
    ActivityMainBinding binding; //Sử dụng View Binding để tương tác với các view trong layout activity_main
    StorageReference storageReference; //Để tham chiếu đến Firebase Storage
    ProgressDialog progressDialog; //Đối tượng hiển thị cửa sổ tiến độ
    private static final String TAG = MainActivity.class.getSimpleName();
    public static Intent newIntent(Context context) { Log.d(TAG,"newIntent()");
        return new Intent(context.getApplicationContext(), MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
    }
    private static final int PERMISSION_STATE = 0;
    private static final int CAMERA_REQUEST = 1;
    //Các tham chiếu đến các thành phần giao diện người dùng
    private Button imgCamera;
    private ImageView imgResult;
    private Button btnPredict;
    private TextView txtPrediction;
    private Bitmap bitmap;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.d(TAG, "onCreate()");
        super.onCreate(savedInstanceState); //Gọi phương thức của lớp cha để hoàn tất việc tạo Activity
        setContentView(R.layout.activity_main); //Thiết lập layout cho Activity từ file XML
        //Đọc ghi dữ liệu: Khởi tạo Firebase Database và tham chiếu đến node "message" trong cơ sở dữ liệu
        FirebaseDatabase database = FirebaseDatabase.getInstance();
        DatabaseReference message = database.getReference("message");
        //Liên kết các thành phần giao diện người dùng với các ID trong XML
        imgResult = (ImageView) findViewById(R.id.imageView);
        txtPrediction = (TextView) findViewById(R.id.edtMessage);
        //ERROR
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                Looper.prepare(); // tạo Looper cho thread
                Handler handler = new Handler(); // tạo Handler
                while (true) {
                    // Thực hiện các tác vụ cần thiết ở đây
                    try {
                        Thread.sleep(1000); // tạm dừng 1 giây trước khi thực hiện lại
                        progressDialog = new ProgressDialog(MainActivity.this);
                        progressDialog.setMessage("Fetching image...");
                        progressDialog.setCancelable(false);
                        progressDialog.show();
                        //Tải ảnh từ Firebase Storage và hiển thị lên ImageView
                        String imageID = binding.edtName.getText().toString();
                        storageReference = FirebaseStorage.getInstance().getReference("images/" + imageID + ".jpg");
                        try {
                            File localfile = File.createTempFile("tempfile", ".jpg");
                            storageReference.getFile(localfile)
                                    .addOnSuccessListener(new OnSuccessListener<FileDownloadTask.TaskSnapshot>() {
                                        @Override
                                        public void onSuccess(FileDownloadTask.TaskSnapshot taskSnapshot) {
                                            if (progressDialog.isShowing())
                                                progressDialog.dismiss();
                                            Bitmap bitmap = BitmapFactory.decodeFile(localfile.getAbsolutePath());
                                            binding.imageView.setImageBitmap(bitmap);
                                            message.setValue("Scan.... !!!");
                                            binding.imageView.setDrawingCacheEnabled(true);
                                            Bitmap bt = Bitmap.createBitmap(binding.imageView.getDrawingCache());
                                            binding.imageView.setDrawingCacheEnabled(false);
                                            bitmap = Bitmap.createScaledBitmap(bt, 224, 224, true);
                                            try {
                                                Log.d(TAG, "try");
                                                Model model = Model.newInstance(getApplicationContext());
                                                // Creates inputs for reference.
                                                TensorBuffer inputFeature0 = TensorBuffer.createFixedSize(new int[]{1, 224, 224, 3}, DataType.UINT8);
                                                TensorImage tensorImage = new TensorImage(DataType.UINT8);
                                                tensorImage.load(bitmap);
                                                ByteBuffer byteBuffer = tensorImage.getBuffer();
                                                inputFeature0.loadBuffer(byteBuffer);
                                                // Runs model inference and gets result.
                                                Model.Outputs outputs = model.process(inputFeature0);
                                                TensorBuffer outputFeature0 = outputs.getOutputFeature0AsTensorBuffer();
                                                // Releases model resources if no longer used.
                                                model.close();
                                                message.setValue(getMax(outputFeature0.getFloatArray()));//txtPrediction.setText(outputFeature0.getFloatArray()[0] + "\n" + outputFeature0.getFloatArray()[1] + "\n" +
//                                                sendNotification(getMax(outputFeature0.getFloatArray()), R.drawable.img, 3);
                                                getMax(outputFeature0.getFloatArray());
                                                Log.d("Result", Arrays.toString(outputFeature0.getFloatArray()));
                                            } catch (IOException e) {
                                                Log.e(TAG, "IOException " + e.getMessage());
                                                message.setValue("Lỗi nhân dạng" + e.getMessage());
                                            }
                                        }
                                    }).addOnFailureListener(new OnFailureListener() {
                                       // Đặt một trình lắng nghe trên nút "message" của Firebase Database để cập nhật giao diện người dùng khi dữ liệu thay đổi.
                                        @Override
                                        public void onFailure(@NonNull Exception e) {
                                            if (progressDialog.isShowing())
                                                progressDialog.dismiss();
                                            Toast.makeText(MainActivity.this, "Failed to retrieve", Toast.LENGTH_SHORT);
                                            message.setValue("Tải ảnh thất bại !!!");
                                        }
                                    });
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        });
        thread.start();
        //Kết nối biến với id giao diện
        EditText edtMessage = (EditText) findViewById(R.id.edtMessage);
        // Write a message to the database
        message.setValue("Hello, World!");
        // Read from the database
        message.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                // This method is called once with the initial value and again
                // whenever data at this location is updated.
                String value = dataSnapshot.getValue(String.class);
                Log.d("Tin nhắn", "Value is: " + value);
                edtMessage.setText(value + "");
            }

            @Override
            public void onCancelled(DatabaseError error) {
                // Failed to read value
                Log.w("Tin nhắn", "Failed to read value.", error.toException());
            }
        });
    }
    private String getMax(float [] outputs) { Log.d(TAG,"getMax( " + Arrays.toString(outputs) + ")");
        if (outputs.length != 0 & outputs[0] > outputs[1] & outputs[0] > outputs[2] & outputs[0] > outputs[3]) {
            return "Cây Bị Chết";
        } else if (outputs.length != 0 & outputs[1] > outputs[0] & outputs[1] > outputs[2] & outputs[1] > outputs[3]) {
            return "Cây Khoẻ Mạnh";
        } else if (outputs.length != 0 & outputs[2] > outputs[0] & outputs[2] > outputs[1] & outputs[2] > outputs[3]) {
            return "Cây Bị Héo";
        } else if (outputs.length != 0 & outputs[3] > outputs[0] & outputs[3] > outputs[1]  & outputs[3] > outputs[2]) {
            return "Cây Bị Sâu";
        } else {
            return "-----";
        }
    }
    private void sendNotification(String text, int icon, int id){
    // Phương thức để gửi thông báo đến người dùng với text và icon chỉ định
        // Khởi tạo NotificationManager
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

// Tạo NotificationChannel (chỉ cần làm một lần)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Tên và mô tả của NotificationChannel
            CharSequence name = "My Notification Channel";
            String description = "Channel for my app's notifications";

            // Mức độ quan trọng của thông báo trên channel này
            int importance = NotificationManager.IMPORTANCE_DEFAULT;

            // Khởi tạo NotificationChannel
            NotificationChannel channel = new NotificationChannel("my_channel_id", name, importance);
            channel.setDescription(description);

            // Thêm NotificationChannel vào NotificationManager
            notificationManager.createNotificationChannel(channel);
        }

// Khởi tạo thông báo
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, "my_channel_id")
                .setSmallIcon(icon)
                .setContentTitle("Hệ thống SmartGarden")
                .setContentText(text)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);

// Thêm hình ảnh vào thông báo (nếu có)
        Bitmap bitmap = BitmapFactory.decodeResource(getResources(), icon);
        builder.setStyle(new NotificationCompat.BigPictureStyle().bigPicture(bitmap));

// Thêm các thông tin khác
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        builder.setContentIntent(pendingIntent);
        builder.setAutoCancel(true);

// Tạo thông báo và hiển thị lên thiết bị
        notificationManager.notify(id, builder.build());
    }
}